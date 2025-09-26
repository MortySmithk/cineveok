// app/lib/utils.ts
export function generateSlug(title: string): string {
  if (!title) return 'sem-titulo';
  
  return title
    .toLowerCase()
    .normalize("NFD") // Remove acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais, exceto hífens e espaços
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-'); // Remove hífens duplicados
}