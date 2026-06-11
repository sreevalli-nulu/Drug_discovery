import httpx

smiles = "Cc1ccc(NC(=O)c2ccc(CN3CCN(C)CC3)cc2)cc1Nc1nccc(-c2cccnc2)n1"

# Try POST instead of GET
urls_to_try = [
    "https://www.ebi.ac.uk/chembl/api/utils/smiles2svg",
    "https://www.ebi.ac.uk/chembl/api/utils/smiles2image",
    "https://www.ebi.ac.uk/chembl/api/utils/render",
]

for url in urls_to_try:
    try:
        # Try POST with JSON
        response = httpx.post(
            url,
            json={"smiles": smiles},
            timeout=15.0,
        )
        print(f"POST JSON to: {url}")
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type')}")
        print(f"Preview: {response.text[:100]}")
        print("---")
    except Exception as e:
        print(f"Error: {e}")
        print("---")

    try:
        # Try POST with form data
        response = httpx.post(
            url,
            data={"smiles": smiles},
            timeout=15.0,
        )
        print(f"POST form to: {url}")
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type')}")
        print(f"Preview: {response.text[:100]}")
        print("---")
    except Exception as e:
        print(f"Error: {e}")
        print("---")