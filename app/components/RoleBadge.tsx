type Props = {
  role: string;
};

export default function RoleBadge({ role }: Props) {
  return (
    <span className="rounded-full bg-blue-600 px-3 py-1 text-sm text-white">
      {role}
    </span>
  );
}