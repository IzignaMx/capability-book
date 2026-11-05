"""Invalidate only the Book hostname after its successful Pages deployment."""
import argparse
import json
import os
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener

HOST = 'book.izignamx.com'
MAX_RESPONSE_BYTES = 65536


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError('Unexpected redirect refused')


def trusted_main(env):
    if (env.get('GITHUB_REPOSITORY') != 'IzignaMx/capability-book'
            or env.get('GITHUB_REF') != 'refs/heads/main'
            or env.get('GITHUB_EVENT_NAME') not in ('push', 'workflow_dispatch')):
        raise ValueError('Book delivery requires a trusted main-branch run')


def credentials(env):
    trusted_main(env)
    zone = env.get('CLOUDFLARE_ZONE_ID', '').strip()
    token = env.get('CLOUDFLARE_API_TOKEN', '').strip()
    if not re.fullmatch(r'[a-fA-F0-9]{32}', zone):
        raise ValueError('Configure the CLOUDFLARE_ZONE_ID Actions variable')
    if not token or any(ord(char) < 33 or ord(char) > 126 for char in token):
        raise ValueError('Configure the CLOUDFLARE_API_TOKEN Actions secret')
    return zone, token


def read_json(response):
    body = response.read(MAX_RESPONSE_BYTES + 1)
    if len(body) > MAX_RESPONSE_BYTES:
        raise RuntimeError('Response exceeds the diagnostic bound')
    try:
        return json.loads(body)
    except (ValueError, UnicodeError):
        raise RuntimeError('Invalid JSON response') from None


def purge(env, send=None):
    zone, token = credentials(env)
    request = Request(
        'https://api.cloudflare.com/client/v4/zones/' + zone + '/purge_cache',
        data=json.dumps({'hosts': [HOST]}).encode(), method='POST',
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
    send = send or build_opener(NoRedirect()).open
    try:
        with send(request, timeout=20) as response:
            if response.status != 200:
                raise RuntimeError('Cloudflare did not accept the purge request')
            data = read_json(response)
    except HTTPError as error:
        raise RuntimeError('Cloudflare purge failed: HTTP ' + str(error.code)
                           + '; check zone access and Cache Purge permission') from None
    except (URLError, TimeoutError, OSError):
        raise RuntimeError('Cloudflare purge transport failed; retry the deploy job') from None
    if not isinstance(data, dict) or data.get('success') is not True or data.get('errors') != []:
        raise RuntimeError('Cloudflare rejected the purge request')
    print('Cloudflare accepted cache invalidation for ' + HOST, flush=True)


def verify_release(env, send=None, pause=time.sleep, attempts=12):
    trusted_main(env)
    revision = env.get('GITHUB_SHA', '')
    if not re.fullmatch(r'[a-fA-F0-9]{40}', revision):
        raise ValueError('Missing deployed GITHUB_SHA')
    send = send or build_opener(NoRedirect()).open
    request = Request('https://' + HOST + '/release.json',
                      headers={'User-Agent': 'IzignaMx-Book-Release-Verification/1.0'})
    for attempt in range(attempts):
        try:
            with send(request, timeout=10) as response:
                data = read_json(response)
                if (response.status == 200 and isinstance(data, dict)
                        and data.get('buildRevision') == revision
                        and data.get('indexable') is True):
                    print('Ordinary production release verified: ' + revision, flush=True)
                    return
        except (HTTPError, URLError, TimeoutError, OSError, RuntimeError):
            pass
        if attempt + 1 < attempts:
            pause(5)
    raise RuntimeError('Production release did not match the deployed revision after invalidation')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument('--check-config', action='store_true')
    modes.add_argument('--verify-release', action='store_true')
    args = parser.parse_args()
    try:
        if args.check_config:
            credentials(os.environ)
            print('Required Cloudflare configuration is present; API permissions remain unverified.')
        elif args.verify_release:
            verify_release(os.environ)
        else:
            purge(os.environ)
        return 0
    except (ValueError, RuntimeError, OSError) as error:
        print('Book CDN delivery failed: ' + str(error), file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
