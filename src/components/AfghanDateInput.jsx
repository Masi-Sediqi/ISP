export default function AfghanDateInput({ value = "", onChange, ...props }) {
  return (
    <input
      type="date"
      value={value || ""}
      onChange={(event) => onChange?.(event.target.value)}
      {...props}
    />
  );
}
