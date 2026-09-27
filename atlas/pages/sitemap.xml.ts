import {allRoutes,parseRoute} from '../book/model';
export const prerender=true;
export function GET(){const routes=process.env.ATLAS_INDEXABLE==='true'?allRoutes.filter(p=>parseRoute(p)?.page!=='compare'):[];return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.map(p=>'<url><loc>https://book.izignamx.com'+p+'</loc></url>').join('')+'</urlset>',{headers:{'Content-Type':'application/xml'}});}
