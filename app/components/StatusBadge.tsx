type Props = {
  status: string;
};

export default function StatusBadge({ status }: Props) {
  return (
    <span className="rounded-full bg-green-600 px-3 py-1 text-sm text-white">
      {status}
    </span>
  );
}