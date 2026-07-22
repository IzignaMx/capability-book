export interface ExploreFallbackProps {
  readonly poster: string;
  readonly label: string;
}

export function ExploreFallback({ poster, label }: ExploreFallbackProps) {
  return (
    <figure className="explore-fallback" data-explore-fallback>
      <img
        src={poster}
        alt=""
        width="1600"
        height="900"
        fetchPriority="high"
      />
      <figcaption>{label}</figcaption>
    </figure>
  );
}
