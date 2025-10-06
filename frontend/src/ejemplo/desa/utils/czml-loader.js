// Utilidad para cargar archivos CZML
export async function loadCzml(viewer, url) {
  const dataSource = await Cesium.CzmlDataSource.load(url);
  viewer.dataSources.add(dataSource);
  return dataSource;
}
