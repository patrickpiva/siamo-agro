// Permite importar arquivos CSS como módulos (necessário para maplibre-gl)
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
