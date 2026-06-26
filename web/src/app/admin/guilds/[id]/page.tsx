import EditGuildClient from "./EditGuildClient";

export function generateStaticParams() {
  return [{ id: "_placeholder" }];
}

export default function EditGuildPage() {
  return <EditGuildClient />;
}
