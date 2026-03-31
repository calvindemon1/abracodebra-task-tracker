export default function AuthLayout(props) {
  return (
    <div class="flex items-center justify-center min-h-screen w-screen bg-gray-100">
      <div class="">{props.children}</div>
    </div>
  );
}
