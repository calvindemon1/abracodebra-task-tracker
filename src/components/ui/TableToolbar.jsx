import { Search, ArrowUpDown } from "lucide-solid";

export default function TableToolbar(props) {
  return (
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 px-1">
      {/* Kolom Search */}
      <div class="relative w-full sm:w-72">
        <Search
          size={16}
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder={props.placeholder || "Cari data..."}
          value={props.search}
          onInput={(e) => {
            props.setSearch(e.target.value);
            if (props.onFilterChange) props.onFilterChange(); // Reset page ke 1
          }}
          class="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-400 transition-all duration-200"
        />
      </div>

      {/* Kolom Sort */}
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <ArrowUpDown size={16} class="text-gray-400" />
        <select
          value={props.sort}
          onChange={(e) => {
            props.setSort(e.target.value);
            if (props.onFilterChange) props.onFilterChange(); // Reset page ke 1
          }}
          class="w-full sm:w-auto px-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-400 cursor-pointer transition-all duration-200"
        >
          <option value="newest">Terbaru</option>
          <option value="asc">A - Z</option>
          <option value="desc">Z - A</option>
        </select>
      </div>
    </div>
  );
}
