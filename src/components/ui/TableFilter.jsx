import { createSignal, createEffect, For } from "solid-js";
import {
  Search,
  ArrowUpDown,
  MapPin,
  Activity,
  ChevronDown,
} from "lucide-solid"; // Tambahan Icon

export default function TableFilter(props) {
  const [search, setSearch] = createSignal("");
  const [sort, setSort] = createSignal("");
  const [location, setLocation] = createSignal("");
  const [condition, setCondition] = createSignal("");

  // trigger ke parent setiap ada perubahan
  createEffect(() => {
    props.onChange?.({
      search: search(),
      sort: sort(),
      location: location(),
      condition: condition(),
    });
  });

  // Reusable Class biar rapi & konsisten
  const baseInputClass =
    "w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 " +
    "focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-400 transition-all duration-200 cursor-pointer appearance-none";

  return (
    <div class="flex flex-col lg:flex-row gap-3 items-center mb-6 bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
      {/* 🔍 Search Input (Flex-grow biar ngisi sisa space) */}
      <div class="relative w-full lg:flex-1">
        <Search
          size={18}
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-400 transition-all duration-200"
          placeholder="Cari asset berdasarkan nama atau kode..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      {/* Wrapper buat Select Dropdowns (Grid biar rapi) */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
        {/* 🔽 Sort */}
        <div class="relative w-full lg:w-44">
          <ArrowUpDown
            size={16}
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <select
            class={baseInputClass}
            value={sort()}
            onInput={(e) => setSort(e.currentTarget.value)}
          >
            <option value="" disabled hidden>
              Urutkan
            </option>
            <option value="">Default (Tidak diurutkan)</option>
            <For each={props.sortOptions || []}>
              {(opt) => <option value={opt.value}>{opt.label}</option>}
            </For>
          </select>
          <ChevronDown
            size={14}
            class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        {/* 📍 Filter Location */}
        <div class="relative w-full lg:w-44">
          <MapPin
            size={16}
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <select
            class={baseInputClass}
            value={location()}
            onInput={(e) => setLocation(e.currentTarget.value)}
          >
            <option value="">Semua Lokasi</option>
            <For each={props.locations || []}>
              {(loc) => <option value={loc.id}>{loc.name}</option>}
            </For>
          </select>
          <ChevronDown
            size={14}
            class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        {/* ⚙️ Filter Condition */}
        <div class="relative w-full lg:w-44">
          <Activity
            size={16}
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <select
            class={baseInputClass}
            value={condition()}
            onInput={(e) => setCondition(e.currentTarget.value)}
          >
            <option value="">Semua Kondisi</option>
            <For each={props.conditions || []}>
              {(c) => <option value={c.id}>{c.name}</option>}
            </For>
          </select>
          <ChevronDown
            size={14}
            class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
