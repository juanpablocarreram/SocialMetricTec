import requests
def list_proyects_preview():
    url = 'http://localhost:8000/project/listpreview'
    # Realizamos el POST
    response = requests.get(url)
    # Verificamos la respuesta
    if response.status_code == 200:
        print("¡Éxito, esta es la vista previa de los proyectos!:", response.json())
        return response.json()
    else:
        print(f"Error {response.status_code}: {response.text}")
        return "Error"
list_proyects_preview()