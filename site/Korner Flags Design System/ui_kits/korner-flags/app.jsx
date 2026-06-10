/* Korner Flags UI kit — hash router + mount. */
function useHashRoute() {
  const [route, setRoute] = React.useState(window.location.hash.slice(1) || "/");
  React.useEffect(() => {
    const onHash = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (path) => { window.location.hash = path; const r = document.querySelector("#scroll-root"); if (r) r.scrollTop = 0; window.scrollTo(0, 0); };
  return [route, go];
}

function App() {
  const [route, go] = useHashRoute();
  if (route === "/" || route === "") return <Landing go={go}/>;
  if (route === "/dashboard") return <Dashboard go={go}/>;
  if (route === "/matches") return <PastMatches go={go}/>;
  if (route.startsWith("/analysis/")) return <MatchAnalysis go={go} id={route.split("/")[2]}/>;
  if (route === "/checkout") return <Checkout go={go}/>;
  return <Landing go={go}/>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
