export default function Button(props) {
  return (
    <button
      class={`px-4 py-2 rounded font-medium bg-blue-600 text-white hover:bg-blue-700 ${props.class}`}
      {...props}
    >
      {props.children}
    </button>
  );
}
