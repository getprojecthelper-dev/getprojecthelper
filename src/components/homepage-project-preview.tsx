export type ProjectKind = "campus" | "analytics" | "collaboration" | "research";

export function HomepageProjectPreview({
  kind,
  title,
}: {
  kind: ProjectKind;
  title: string;
}) {
  return (
    <div className="homepage-project-preview" role="img" aria-label={`Interface preview for ${title}`}>
      <svg viewBox="0 0 640 360" aria-hidden="true">
        <rect width="640" height="360" fill="#edf3fb" />
        <rect x="22" y="18" width="596" height="324" rx="16" fill="#fff" stroke="#dce4ef" />
        <path d="M22 58h596" stroke="#e8edf4" />
        <circle cx="44" cy="38" r="5" fill="#4285f4" />
        <circle cx="62" cy="38" r="5" fill="#ea4335" />
        <circle cx="80" cy="38" r="5" fill="#fbbc04" />
        <circle cx="98" cy="38" r="5" fill="#34a853" />
        <rect x="122" y="32" width="128" height="11" rx="5.5" fill="#e9eef5" />
        <rect x="40" y="82" width="112" height="236" rx="8" fill="#f7f9fc" />
        <rect x="58" y="103" width="68" height="8" rx="4" fill="#dfe7f1" />
        <rect x="52" y="128" width="84" height="26" rx="6" fill="#e8f0fe" />
        <rect x="61" y="137" width="54" height="8" rx="4" fill="#4285f4" />
        <rect x="58" y="172" width="61" height="7" rx="3.5" fill="#dfe7f1" />
        <rect x="58" y="194" width="72" height="7" rx="3.5" fill="#dfe7f1" />
        <rect x="58" y="216" width="54" height="7" rx="3.5" fill="#dfe7f1" />
        {kind === "campus" ? <CampusPreview /> : null}
        {kind === "analytics" ? <AnalyticsPreview /> : null}
        {kind === "collaboration" ? <CollaborationPreview /> : null}
        {kind === "research" ? <ResearchPreview /> : null}
      </svg>
    </div>
  );
}

function CampusPreview() {
  return (
    <g>
      <text x="180" y="92" className="homepage-project-preview__title">My week</text>
      <rect x="178" y="108" width="265" height="184" rx="9" fill="#fff" stroke="#e4eaf2" />
      <text x="196" y="132" className="homepage-project-preview__label">TODAY · MONDAY</text>
      <path d="M196 150h226M196 195h226M196 240h226" stroke="#edf1f6" />
      <rect x="196" y="160" width="3" height="25" rx="1.5" fill="#4285f4" />
      <rect x="209" y="162" width="106" height="7" rx="3.5" fill="#52627a" />
      <rect x="209" y="175" width="73" height="6" rx="3" fill="#a5b1c1" />
      <rect x="196" y="205" width="3" height="25" rx="1.5" fill="#34a853" />
      <rect x="209" y="207" width="124" height="7" rx="3.5" fill="#52627a" />
      <rect x="209" y="220" width="84" height="6" rx="3" fill="#a5b1c1" />
      <rect x="196" y="250" width="3" height="25" rx="1.5" fill="#fbbc04" />
      <rect x="209" y="252" width="96" height="7" rx="3.5" fill="#52627a" />
      <rect x="209" y="265" width="66" height="6" rx="3" fill="#a5b1c1" />
      <rect x="458" y="108" width="138" height="184" rx="9" fill="#f8fafc" stroke="#e4eaf2" />
      <text x="475" y="132" className="homepage-project-preview__label">UP NEXT</text>
      <rect x="475" y="151" width="104" height="8" rx="4" fill="#dfe7f1" />
      <rect x="475" y="170" width="82" height="6" rx="3" fill="#e8edf4" />
      <rect x="475" y="198" width="104" height="8" rx="4" fill="#dfe7f1" />
      <rect x="475" y="217" width="72" height="6" rx="3" fill="#e8edf4" />
      <rect x="475" y="245" width="104" height="25" rx="6" fill="#e6f4ea" />
      <text x="485" y="261" className="homepage-project-preview__green">2 tasks due</text>
    </g>
  );
}

function AnalyticsPreview() {
  return (
    <g>
      <text x="180" y="92" className="homepage-project-preview__title">Overview</text>
      {[0, 1, 2].map((item) => (
        <g key={item}>
          <rect x={178 + item * 142} y="108" width="130" height="58" rx="8" fill="#fff" stroke="#e4eaf2" />
          <rect x={192 + item * 142} y="121" width="54" height="6" rx="3" fill="#a5b1c1" />
          <rect x={192 + item * 142} y="138" width={item === 1 ? 68 : 44} height="12" rx="4" fill={item === 1 ? "#34a853" : "#34445c"} />
        </g>
      ))}
      <rect x="178" y="180" width="418" height="112" rx="8" fill="#fff" stroke="#e4eaf2" />
      <path d="M198 266h378M198 238h378M198 210h378" stroke="#edf1f6" />
      <path d="m204 253 48-14 44 6 49-34 45 12 46-22 45 7 47-25 42 4" fill="none" stroke="#4285f4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M204 275v-8h13v8M230 275v-19h13v19M256 275v-28h13v28M282 275v-15h13v15M308 275v-36h13v36M334 275v-23h13v23M360 275v-43h13v43" fill="#e8f0fe" />
      <circle cx="530" cy="216" r="5" fill="#ea4335" />
      <circle cx="577" cy="220" r="5" fill="#fbbc04" />
    </g>
  );
}

function CollaborationPreview() {
  return (
    <g>
      <text x="180" y="92" className="homepage-project-preview__title">Project board</text>
      {[
        { x: 178, color: "#4285f4", count: 2 },
        { x: 320, color: "#fbbc04", count: 2 },
        { x: 462, color: "#34a853", count: 1 },
      ].map((column, index) => (
        <g key={column.x}>
          <rect x={column.x} y="108" width="132" height="184" rx="8" fill="#f8fafc" stroke="#e4eaf2" />
          <circle cx={column.x + 14} cy="125" r="4" fill={column.color} />
          <rect x={column.x + 25} y="121" width="68" height="7" rx="3.5" fill="#718096" />
          {Array.from({ length: column.count }).map((_, cardIndex) => (
            <g key={cardIndex}>
              <rect x={column.x + 9} y={143 + cardIndex * 66} width="114" height="55" rx="6" fill="#fff" stroke="#e3e9f1" />
              <rect x={column.x + 19} y={154 + cardIndex * 66} width={cardIndex ? 63 : 78} height="6" rx="3" fill="#52627a" />
              <rect x={column.x + 19} y={167 + cardIndex * 66} width="86" height="5" rx="2.5" fill="#d8e0eb" />
              <circle cx={column.x + 25} cy={185 + cardIndex * 66} r="5" fill={index === 1 ? "#ea4335" : column.color} />
              <rect x={column.x + 36} y={182 + cardIndex * 66} width="36" height="6" rx="3" fill="#e8edf4" />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

function ResearchPreview() {
  return (
    <g>
      <text x="180" y="92" className="homepage-project-preview__title">Research notes</text>
      <rect x="178" y="108" width="274" height="184" rx="8" fill="#fff" stroke="#e4eaf2" />
      <text x="196" y="132" className="homepage-project-preview__label">LITERATURE REVIEW</text>
      <rect x="196" y="148" width="208" height="9" rx="4.5" fill="#35465f" />
      <rect x="196" y="169" width="232" height="5" rx="2.5" fill="#c7d1df" />
      <rect x="196" y="181" width="218" height="5" rx="2.5" fill="#d6dee8" />
      <rect x="196" y="193" width="225" height="5" rx="2.5" fill="#d6dee8" />
      <rect x="196" y="216" width="210" height="7" rx="3.5" fill="#78869a" />
      <rect x="196" y="233" width="232" height="5" rx="2.5" fill="#d6dee8" />
      <rect x="196" y="245" width="194" height="5" rx="2.5" fill="#d6dee8" />
      <rect x="196" y="257" width="218" height="5" rx="2.5" fill="#d6dee8" />
      <rect x="466" y="108" width="130" height="184" rx="8" fill="#f8fafc" stroke="#e4eaf2" />
      <text x="480" y="132" className="homepage-project-preview__label">SOURCES</text>
      <rect x="480" y="146" width="102" height="48" rx="6" fill="#fff" stroke="#e4eaf2" />
      <circle cx="491" cy="159" r="4" fill="#4285f4" />
      <rect x="501" y="156" width="65" height="5" rx="2.5" fill="#a5b1c1" />
      <rect x="491" y="170" width="76" height="5" rx="2.5" fill="#e1e7ef" />
      <rect x="480" y="203" width="102" height="48" rx="6" fill="#fff" stroke="#e4eaf2" />
      <circle cx="491" cy="216" r="4" fill="#34a853" />
      <rect x="501" y="213" width="65" height="5" rx="2.5" fill="#a5b1c1" />
      <rect x="491" y="227" width="76" height="5" rx="2.5" fill="#e1e7ef" />
    </g>
  );
}
