export default function DisclaimerFooter() {
  return (
    <footer
      className="py-3 px-6 text-center text-xs border-t"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--muted)'
      }}
    >
      <p>
        <strong>Autoclik</strong> is a proprietary product of <strong>FIS</strong> (Fidelity National Information Services, Inc.).
        All rights reserved. © {new Date().getFullYear()} FIS. Unauthorized use, reproduction, or distribution is prohibited.
      </p>
    </footer>
  );
}
