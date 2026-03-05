const BASE = "";

export async function getProducts() {
  const r = await fetch(`${BASE}/products`);
  return r.json();
}

export async function addProduct(p) {
  const r = await fetch(`${BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p)
  });
  return r.json();
}

export async function updateProduct(p) {
  const r = await fetch(`${BASE}/products/${p.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p)
  });
  return r.json();
}

export async function deleteProduct(id) {
  await fetch(`${BASE}/products/${id}`, { method: "DELETE" });
}

export async function getCash() {
  const r = await fetch(`${BASE}/cash`);
  return r.json();
}

export async function addCashEntry(c) {
  const r = await fetch(`${BASE}/cash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(c)
  });
  return r.json();
}

export async function deleteCashEntry(id) {
  await fetch(`${BASE}/cash/${id}`, { method: "DELETE" });
}