"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RetailCatalogItem } from "@/domain/catalog/types";
import { formatRetailPrice } from "./public-content";
import { ProductGrid } from "./commerce-ui";
import { EmptyState } from "@/ui/states/commerce-states";

const durations = ["1 bulan", "3 bulan", "12 bulan", "Saldo Rp500.000"];
const regions = ["Global", "Indonesia"];

export function CatalogExperience({ items, initialQuery = "", categoryName }: { items: RetailCatalogItem[]; initialQuery?: string; categoryName?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [duration, setDuration] = useState("");
  const [region, setRegion] = useState("");
  const [sort, setSort] = useState("popular");
  const [visibleCount, setVisibleCount] = useState(4);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const filterSheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;

    const trigger = filterTriggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    filterSheetRef.current?.querySelector<HTMLElement>("button")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFiltersOpen(false);
        return;
      }
      if (event.key !== "Tab" || !filterSheetRef.current) return;

      const focusable = Array.from(filterSheetRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [filtersOpen]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id-ID");
    const matched = items.filter((item) => {
      const queryMatch = !needle || `${item.productName} ${item.sku} ${item.duration} ${item.region}`.toLocaleLowerCase("id-ID").includes(needle);
      return queryMatch && (!duration || item.duration === duration) && (!region || item.region === region);
    });
    if (sort === "price-low") return [...matched].sort((a, b) => a.retailPrice - b.retailPrice);
    if (sort === "price-high") return [...matched].sort((a, b) => b.retailPrice - a.retailPrice);
    if (sort === "name") return [...matched].sort((a, b) => a.productName.localeCompare(b.productName, "id"));
    return matched;
  }, [duration, items, query, region, sort]);

  const activeFilterCount = Number(Boolean(duration)) + Number(Boolean(region));
  const clearFilters = () => { setDuration(""); setRegion(""); setQuery(""); setVisibleCount(4); };

  const filterControls = (
    <>
      <fieldset className="filter-group"><legend>Durasi / nominal</legend>{durations.map((value) => <label key={value}><input checked={duration === value} onChange={() => setDuration(duration === value ? "" : value)} type="checkbox" />{value}</label>)}</fieldset>
      <fieldset className="filter-group"><legend>Wilayah</legend>{regions.map((value) => <label key={value}><input checked={region === value} onChange={() => setRegion(region === value ? "" : value)} type="checkbox" />{value}</label>)}</fieldset>
      <button className="filter-clear" onClick={clearFilters} type="button">Hapus semua filter</button>
    </>
  );

  return (
    <div className="catalog-layout">
      <aside className="filter-sidebar" aria-label="Filter produk"><div className="filter-sidebar__heading"><h2>Filter</h2>{activeFilterCount > 0 && <span>{activeFilterCount} aktif</span>}</div>{filterControls}</aside>
      <section className="catalog-results" aria-label={categoryName ? `Produk kategori ${categoryName}` : "Hasil belanja"}>
        <div className="catalog-toolbar">
          <form action="/shop" className="catalog-toolbar__search" role="search" onSubmit={(event) => { event.preventDefault(); setVisibleCount(4); }}>
            <label className="visually-hidden" htmlFor="shop-query">Cari produk</label><span aria-hidden="true">⌕</span>
            <input id="shop-query" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(4); }} placeholder="Cari produk digital..." />
            <button className="catalog-toolbar__submit" type="submit" aria-label="Cari produk">↵</button>
            {query && <button type="button" aria-label="Hapus pencarian" onClick={() => setQuery("")}>×</button>}
          </form>
          <button aria-controls="filter-sheet" aria-expanded={filtersOpen} aria-haspopup="dialog" className="mobile-filter-trigger" ref={filterTriggerRef} type="button" onClick={() => setFiltersOpen(true)}>Filter{activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button>
          <label className="sort-control"><span>Urutkan</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="popular">Pilihan Bacshop</option><option value="price-low">Harga terendah</option><option value="price-high">Harga tertinggi</option><option value="name">Nama A–Z</option></select></label>
        </div>
        <div className="catalog-quick-filters" aria-label="Filter cepat">{[...durations.slice(0, 3), ...regions].map((value) => <button aria-pressed={duration === value || region === value} className={duration === value || region === value ? "quick-filter is-selected" : "quick-filter"} key={value} onClick={() => durations.includes(value) ? setDuration(duration === value ? "" : value) : setRegion(region === value ? "" : value)} type="button">{value}</button>)}</div>
        <p className="results-count" aria-live="polite">{categoryName ? `${categoryName} · ` : ""}{filtered.length} produk</p>
        {filtered.length === 0 ? <EmptyState title="Produk tidak ditemukan" description="Coba ubah kata pencarian atau hapus filter untuk melihat pilihan lainnya." onReset={clearFilters} /> : <>
          <ProductGrid items={filtered.slice(0, visibleCount)} />
          {visibleCount < filtered.length && <div className="load-more"><button className="button button--secondary" onClick={() => setVisibleCount((count) => count + 4)} type="button">Muat lainnya <span aria-hidden="true">↓</span></button><small>Menampilkan {Math.min(visibleCount, filtered.length)} dari {filtered.length} produk</small></div>}
        </>}
      </section>
      {filtersOpen && <div className="filter-sheet-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}><section className="filter-sheet" id="filter-sheet" ref={filterSheetRef} role="dialog" aria-modal="true" aria-labelledby="filter-sheet-title" tabIndex={-1}><div className="filter-sheet__handle" /><div className="filter-sidebar__heading"><h2 id="filter-sheet-title">Filter produk</h2><button aria-label="Tutup filter" onClick={() => setFiltersOpen(false)} type="button">×</button></div>{filterControls}<button className="button button--primary filter-sheet__apply" onClick={() => setFiltersOpen(false)} type="button">Lihat {filtered.length} produk</button></section></div>}
    </div>
  );
}

export function CompactProductPrice({ item }: { item: RetailCatalogItem }) {
  return <span className="compact-product-price">{formatRetailPrice(item.retailPrice)}</span>;
}
