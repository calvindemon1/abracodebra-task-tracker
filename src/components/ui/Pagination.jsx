import { ChevronLeft, ChevronRight } from "lucide-solid";
import { createMemo } from "solid-js";

export default function Pagination(props) {
  const totalPages = createMemo(
    () => Math.ceil(props.totalItems / props.itemsPerPage) || 1,
  );

  return (
    <div class="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-4">
      <span class="text-sm text-gray-500">
        Menampilkan{" "}
        <span class="font-bold text-gray-700">
          {props.totalItems === 0
            ? 0
            : (props.currentPage - 1) * props.itemsPerPage + 1}
        </span>{" "}
        hingga{" "}
        <span class="font-bold text-gray-700">
          {Math.min(props.currentPage * props.itemsPerPage, props.totalItems)}
        </span>{" "}
        dari <span class="font-bold text-gray-700">{props.totalItems}</span>{" "}
        data
      </span>

      <div class="flex gap-2">
        <button
          disabled={props.currentPage === 1}
          onClick={() => props.onPageChange(props.currentPage - 1)}
          class="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-black disabled:opacity-50 disabled:hover:bg-white transition-colors active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>
        <div class="flex items-center justify-center px-3 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-lg select-none">
          {props.currentPage} / {totalPages()}
        </div>
        <button
          disabled={props.currentPage === totalPages()}
          onClick={() => props.onPageChange(props.currentPage + 1)}
          class="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-black disabled:opacity-50 disabled:hover:bg-white transition-colors active:scale-95"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
