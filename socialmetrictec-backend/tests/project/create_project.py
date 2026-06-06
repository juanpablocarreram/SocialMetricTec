import requests
def create_project():
    url = 'http://localhost:8000/project/create'
    mi_body = {
        "project_name":"New",
        "description": "Proyecto Dedicado a DI",
        "impact_area":"ods_3",
        "cover_image_url": "localhost:3000",
        "is_active":True,
    }
    
    # Realizamos el POST
    response = requests.post(url, json=mi_body)

    # Verificamos la respuesta
    if response.status_code == 200:
        print("¡Éxito!", response.json())
        return response.json()
    else:
        print(f"Error {response.status_code}: {response.text}")
        return "Error"
create_project()