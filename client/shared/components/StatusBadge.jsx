const COLORS = {
  pending: "bg-amber-100 text-amber-800",
  assigned: "bg-blue-100 text-blue-800",
  in_transit: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
  unpaid: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800"
};

export default function StatusBadge({ status }) {
  const classes = COLORS[status] || "bg-gray-100 text-gray-800";
  const label = status.replace("_", " ");
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs capitalize ${classes}`}>
      {label}
    </span>
  );
}
