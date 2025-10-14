import os
import requests
import argparse
import json
import boto3

# --- CONFIGURACIÓN ---
# Pega aquí tu Token de Acceso de Cesium ION.
CESIUM_ION_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5YmNjZTViYS1hYTZjLTRkZjAtYTM3Yy1hZDZlNjlkMzBhODAiLCJpZCI6NzIzOCwiaWF0IjoxNzU5NzY0MzYwfQ.jZtWix41LN25ci8lSpi_HfOuu594YA_wdoBwwEo4100"

# URLs de la API de Cesium ION
ASSETS_API_URL = "https://api.cesium.com/v1/assets"

def upload_ifc_to_ion(file_path):
    """
    Sube un único archivo IFC a Cesium ION siguiendo el flujo de 3 pasos,
    utilizando Boto3 para una subida segura a S3.
    """
    asset_name = os.path.basename(file_path)
    print(f"Iniciando subida para: {asset_name}...")

    headers = {"Authorization": f"Bearer {CESIUM_ION_ACCESS_TOKEN}"}
    
    # --- PASO 1: Iniciar la creación del asset y obtener las credenciales ---
    try:
        print("   (Paso 1/3) Solicitando URL de subida a Cesium ION...")
        
        # ✅ --- AJUSTE FINAL EN EL FORMATO DEL CRS ---
        payload = {
            "name": asset_name,
            "description": f"Archivo IFC subido desde el script (CRS: EPSG:22182): {asset_name}",
            "type": "3DTILES", 
            "options": { 
                "sourceType": "BIM_CAD", 
                "inputCrs": "EPSG:22182"  # Se añade el prefijo "EPSG:"
            }
        }
        
        response_step1 = requests.post(ASSETS_API_URL, headers=headers, json=payload)
        response_step1.raise_for_status()
        response_data = response_step1.json()
        
        upload_location = response_data.get("uploadLocation")
        on_complete_url = response_data.get("onComplete", {}).get("url")
        asset_id = response_data.get("assetMetadata", {}).get("id")

    except requests.exceptions.RequestException as e:
        print(f"❌ Error en el Paso 1 para '{asset_name}': {e}")
        if e.response is not None:
            print(f"   Respuesta del servidor: {e.response.text}")
        return

    # --- PASO 2: Subir el archivo a S3 usando Boto3 ---
    try:
        print(f"   (Paso 2/3) Subiendo archivo a la ubicación temporal vía Boto3...")
        
        credentials = upload_location
        bucket_name = credentials['bucket']
        object_key = f"{credentials['prefix']}{asset_name}"

        s3_client = boto3.client(
            's3',
            aws_access_key_id=credentials['accessKey'],
            aws_secret_access_key=credentials['secretAccessKey'],
            aws_session_token=credentials['sessionToken']
        )

        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        response_s3_put = s3_client.put_object(
            Bucket=bucket_name,
            Key=object_key,
            Body=file_data
        )
        
        etag = response_s3_put['ETag']
        
    except Exception as e:
        print(f"❌ Error en el Paso 2 (subida a S3) para '{asset_name}': {e}")
        return

    # --- PASO 3: Notificar a Cesium que la subida se completó ---
    try:
        print(f"   (Paso 3/3) Notificando a Cesium ION la finalización de la subida...")
        
        on_complete_payload = {
            "parts": [ { "ETag": etag, "PartNumber": 1 } ]
        }
        
        response_step3 = requests.post(on_complete_url, headers=headers, json=on_complete_payload)
        response_step3.raise_for_status()

        print(f"✅ Éxito: '{asset_name}' se ha subido correctamente y está en proceso.")
        print(f"   ID del Asset: {asset_id}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Error en el Paso 3 para '{asset_name}': {e}")
        if e.response is not None:
            print(f"   Respuesta del servidor: {e.response.text}")
        return
    
def find_and_upload_ifc_files(root_folder):
    """
    Busca todos los archivos .ifc en una carpeta y sus subcarpetas y los sube.
    """
    print(f"Buscando archivos .ifc en la carpeta: {root_folder}\n")
    found_files = False
    
    for dirpath, _, filenames in os.walk(root_folder):
        for filename in filenames:
            if filename.lower().endswith(".ifc"):
                found_files = True
                full_path = os.path.join(dirpath, filename)
                upload_ifc_to_ion(full_path)
                print("-" * 20)

    if not found_files:
        print("No se encontraron archivos .ifc en la carpeta especificada.")

def main():
    """
    Función principal para ejecutar el script desde la línea de comandos.
    """
    parser = argparse.ArgumentParser(
        description="Sube todos los archivos IFC de una carpeta y sus subcarpetas a Cesium ION."
    )
    parser.add_argument(
        "folder_path", type=str,
        help="La ruta a la carpeta que contiene los archivos IFC."
    )
    args = parser.parse_args()

    if not os.path.isdir(args.folder_path):
        print(f"🚨 Error: La carpeta '{args.folder_path}' no existe o no es un directorio válido.")
        return

    find_and_upload_ifc_files(args.folder_path)

if __name__ == "__main__":
    main()