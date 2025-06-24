export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div id="app">
        <div id="pixi-container"></div>
      </div>
      <main>{children}</main>
    </>
  );
}
