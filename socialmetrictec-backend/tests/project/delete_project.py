import requests
from .create_project import create_project
def delete_project():
    project = create_project()
    if project == "Error":
        mensaje_final = "No se pudo crear el proyecto que se va a borrar en la prueba"
        print(mensaje_final)
        return mensaje_final
    print(project)
    url = f'http://localhost:8000/project/{project["project_id"]}/delete'
    # Realizamos el POST
    response = requests.delete(url)
    # Verificamos la respuesta
    if response.status_code == 200:
        print(f"¡Éxito Eliminando el proyecto {project["project_id"]}!")
    else:
        print(f"Error {response.status_code}: {response.text}")
delete_project()