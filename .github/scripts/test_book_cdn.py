"""Offline tests for the Book's production cache invalidation boundary."""
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import MagicMock
from urllib.error import HTTPError, URLError

spec = importlib.util.spec_from_file_location('book_cdn', Path(__file__).with_name('book_cdn.py'))
cdn = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cdn)


class BookCdnTests(unittest.TestCase):
    def config(self):
        return {'GITHUB_REPOSITORY': 'IzignaMx/capability-book',
                'GITHUB_REF': 'refs/heads/main', 'GITHUB_EVENT_NAME': 'push',
                'GITHUB_SHA': 'b' * 40, 'CLOUDFLARE_ZONE_ID': 'a' * 32,
                'CLOUDFLARE_API_TOKEN': 'test-token-not-a-credential'}

    def response(self, data, status=200):
        response = MagicMock()
        response.__enter__.return_value = response
        response.status = status
        response.read.return_value = json.dumps(data).encode()
        return response

    def test_only_main_push_and_manual_delivery_are_accepted(self):
        for key, value in [('GITHUB_REPOSITORY', 'IzignaMx/other'),
                           ('GITHUB_REF', 'refs/heads/feature'),
                           ('GITHUB_EVENT_NAME', 'pull_request'),
                           ('GITHUB_EVENT_NAME', 'pull_request_target')]:
            env = self.config(); env[key] = value
            send = MagicMock()
            with self.assertRaises(ValueError):
                cdn.purge(env, send)
            send.assert_not_called()
        env = self.config(); env['GITHUB_EVENT_NAME'] = 'workflow_dispatch'
        self.assertEqual(cdn.credentials(env), ('a' * 32, 'test-token-not-a-credential'))

    def test_missing_or_invalid_credentials_fail_without_their_values(self):
        for key, value in [('CLOUDFLARE_ZONE_ID', ''), ('CLOUDFLARE_ZONE_ID', '../bad-zone'),
                           ('CLOUDFLARE_API_TOKEN', ''), ('CLOUDFLARE_API_TOKEN', 'token\nheader')]:
            env = self.config(); env[key] = value
            with self.assertRaisesRegex(ValueError, key) as caught:
                cdn.credentials(env)
            if value:
                self.assertNotIn(value, str(caught.exception))

    def test_request_invalidates_only_the_book_hostname(self):
        send = MagicMock(return_value=self.response({'success': True, 'errors': []}))
        cdn.purge(self.config(), send)
        send.assert_called_once()
        request = send.call_args.args[0]
        self.assertEqual(request.full_url,
                         'https://api.cloudflare.com/client/v4/zones/' + 'a' * 32 + '/purge_cache')
        self.assertEqual(request.get_method(), 'POST')
        self.assertEqual(json.loads(request.data), {'hosts': ['book.izignamx.com']})
        self.assertEqual(request.get_header('Authorization'), 'Bearer test-token-not-a-credential')
        self.assertEqual(send.call_args.kwargs['timeout'], 20)

    def test_api_rejections_are_not_success(self):
        for data in [[], {'success': False, 'errors': []}, {'success': 'true', 'errors': []},
                     {'success': 1, 'errors': []}, {'success': True, 'errors': [{}]}]:
            with self.assertRaisesRegex(RuntimeError, 'rejected'):
                cdn.purge(self.config(), MagicMock(return_value=self.response(data)))

    def test_bad_json_oversized_or_non200_response_fails(self):
        for body, status in [(b'not-json', 200), (b'x' * (cdn.MAX_RESPONSE_BYTES + 1), 200),
                             (b'{}', 202)]:
            response = self.response({}, status); response.read.return_value = body
            with self.assertRaises(RuntimeError):
                cdn.purge(self.config(), MagicMock(return_value=response))

    def test_http_and_transport_errors_do_not_disclose_response_or_credentials(self):
        for error in [HTTPError('https://api.cloudflare.com/', 403,
                                'test-token-not-a-credential', {}, None),
                      URLError('test-token-not-a-credential'), TimeoutError('private detail')]:
            with self.assertRaises(RuntimeError) as caught:
                cdn.purge(self.config(), MagicMock(side_effect=error))
            self.assertNotIn('test-token', str(caught.exception))
            self.assertNotIn('private detail', str(caught.exception))

    def test_redirect_cannot_forward_authorization(self):
        with self.assertRaisesRegex(RuntimeError, 'redirect'):
            cdn.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://other.test/')

    def test_public_verification_needs_no_cloudflare_credentials(self):
        env = self.config(); del env['CLOUDFLARE_ZONE_ID']; del env['CLOUDFLARE_API_TOKEN']
        send = MagicMock(return_value=self.response({'buildRevision': env['GITHUB_SHA'], 'indexable': True}))
        cdn.verify_release(env, send)
        request = send.call_args.args[0]
        self.assertEqual(request.full_url, 'https://book.izignamx.com/release.json')
        self.assertEqual(request.get_method(), 'GET')
        self.assertIsNone(request.get_header('Authorization'))
        self.assertIsNone(request.get_header('Cache-control'))

    def test_stale_or_not_indexable_release_is_retried_until_current(self):
        env = self.config(); pause = MagicMock()
        send = MagicMock(side_effect=[
            self.response({'buildRevision': 'c' * 40, 'indexable': True}),
            self.response({'buildRevision': env['GITHUB_SHA'], 'indexable': False}),
            self.response({'buildRevision': env['GITHUB_SHA'], 'indexable': True})])
        cdn.verify_release(env, send, pause, attempts=3)
        self.assertEqual(send.call_count, 3)
        self.assertEqual(pause.call_count, 2)

    def test_persistent_staleness_and_network_failure_remain_failures(self):
        for send in [MagicMock(return_value=self.response({'buildRevision': 'c' * 40, 'indexable': True})),
                     MagicMock(side_effect=URLError('offline'))]:
            with self.assertRaisesRegex(RuntimeError, 'did not match'):
                cdn.verify_release(self.config(), send, MagicMock(), attempts=2)
            self.assertEqual(send.call_count, 2)

    def test_invalid_release_context_does_not_make_requests(self):
        for key, value in [('GITHUB_SHA', ''), ('GITHUB_SHA', '../revision'),
                           ('GITHUB_EVENT_NAME', 'pull_request')]:
            env = self.config(); env[key] = value; send = MagicMock()
            with self.assertRaises(ValueError):
                cdn.verify_release(env, send)
            send.assert_not_called()


if __name__ == '__main__':
    unittest.main()
