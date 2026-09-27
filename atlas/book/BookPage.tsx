import { Header, Footer } from "./Chrome";
import { Home, Archive, Compare } from "./Discovery";
import { Case } from "./Case";
import { Brief } from "./Brief";
import { Approach, Legal } from "./Editorial";
import { MapPage } from "./Map";
import { getProject, type BookRoute } from "./model";
export function BookPage({ route }: { route: BookRoute }) {
  const l = route.locale,
    p = route.slug ? getProject(route.slug) : undefined;
  return (
    <div className="book" data-page={route.page}>
      <Header route={route} />
      <main className="bk-wrap bk-main" id="contenido">
        {route.page === "home" && <Home locale={l} />}{" "}
        {route.page === "projects" && <Archive locale={l} />}{" "}
        {route.page === "case" && p && <Case project={p} locale={l} />}{" "}
        {route.page === "compare" && <Compare locale={l} />}{" "}
        {route.page === "contact" && <Brief locale={l} />}{" "}
        {route.page === "approach" && <Approach locale={l} />}{" "}
        {route.page === "map" && <MapPage locale={l} />}{" "}
        {(route.page === "privacy" || route.page === "accessibility") && (
          <Legal locale={l} page={route.page} />
        )}
      </main>
      <Footer locale={l} />
    </div>
  );
}
