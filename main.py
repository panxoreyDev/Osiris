import pandas as pd
import asyncio
from fastapi import FastAPI, Query, HTTPException
import asyncpg
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")



#-----------------------login rutas---------------------------------------------------------

# Usuarios de ejemplo para login
fake_users_db = {"isaias@nebelsoftware.com": "12345"}

@app.get("/", response_class=HTMLResponse)
async def login_page():
    """
    Mostrar la página de login al acceder a la raíz.
    """
    with open("static/login.html", "r") as f:
        return HTMLResponse(content=f.read())
    

@app.post("/login/")
async def login(username: str = Form(...), password: str = Form(...)):
    """
    Procesar el login. Si las credenciales son correctas, redirigir a index.html.
    """
    if username in fake_users_db and fake_users_db[username] == password:
        return RedirectResponse(url="/index/", status_code=302)
    return HTMLResponse(content="<h3>Login fallido: credenciales incorrectas</h3>", status_code=401)

@app.get("/index/", response_class=HTMLResponse)
async def index_page():
    """
    Mostrar la página principal después de iniciar sesión.
    """
    with open("static/index.html", "r") as f:
        return HTMLResponse(content=f.read())







async def connect_to_db():
    conn = await asyncpg.connect(
        user='postgres',
        password='12345',
        database='postgres',
        host='localhost'
    )
    return conn

@app.on_event("startup")
async def startup():
    import asyncpg
    # Crear un pool de conexiones
    app.state.db = await asyncpg.create_pool(
        user='postgres',
        password='12345',
        database='postgres',
        host='localhost',
        port=5432
    )

@app.on_event("shutdown")
async def shutdown():
    await app.state.db.close()


# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir acceso desde cualquier origen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#------------------------------------------------------------------------------------------------------------------------------------------------
@app.get("/dispersion/")
async def get_dispersion():
    query = """
        WITH datos_convertidos AS (
            SELECT 
                codigo_barras,
                codigo_tienda,
                CAST(venta_unidades AS NUMERIC) AS ventas,
                CAST(inventario_actual AS NUMERIC) AS inventarios,
                TO_DATE(fecha, 'DD/MM/YYYY') AS fechas
            FROM 
                city_club
            WHERE 
                TO_DATE(fecha, 'DD/MM/YYYY') >= (
                    SELECT TO_DATE(MAX(fecha), 'DD/MM/YYYY') - INTERVAL '5 weeks'
                    FROM city_club
                )
        ),
        ultima_fecha_venta_cte AS (
            SELECT 
                codigo_barras,
                codigo_tienda,
                MAX(fechas) AS ultima_fecha_venta
            FROM 
                datos_convertidos
            WHERE 
                ventas > 0
            GROUP BY 
                codigo_barras, codigo_tienda
        ),
        datos_filtrados AS (
            SELECT 
                codigo_barras,
                codigo_tienda,
                SUM(ventas) AS suma_ventas_5_semanas,
                MAX(inventarios) AS inventario_mas_reciente,
                MAX(fechas) AS ultima_fecha_inventario
            FROM 
                datos_convertidos
            GROUP BY 
                codigo_barras, codigo_tienda
        ),
        calculos AS (
            SELECT
                df.codigo_barras,
                df.codigo_tienda,
                df.suma_ventas_5_semanas,
                df.suma_ventas_5_semanas / 35 AS venta_diaria,
                df.inventario_mas_reciente,
                df.inventario_mas_reciente / NULLIF(df.suma_ventas_5_semanas / 35, 0) AS dias_inventario,
                df.ultima_fecha_inventario,
                ufv.ultima_fecha_venta,
                CASE 
                    WHEN df.inventario_mas_reciente > 0 AND df.suma_ventas_5_semanas = 0 THEN 'stock sin venta'
                    WHEN df.inventario_mas_reciente = 0 AND df.suma_ventas_5_semanas = 0 THEN 'faltante'
                    WHEN df.inventario_mas_reciente / NULLIF(df.suma_ventas_5_semanas / 35, 0) <= 3 THEN '0-3'
                    WHEN df.inventario_mas_reciente / NULLIF(df.suma_ventas_5_semanas / 35, 0) <= 7 THEN '0-7'
                    WHEN df.inventario_mas_reciente / NULLIF(df.suma_ventas_5_semanas / 35, 0) <= 14 THEN '7-14'
                    WHEN df.inventario_mas_reciente / NULLIF(df.suma_ventas_5_semanas / 35, 0) <= 25 THEN '15-25'
                    WHEN df.inventario_mas_reciente / NULLIF(df.suma_ventas_5_semanas / 35, 0) <= 60 THEN '25-60'
                    WHEN df.inventario_mas_reciente / NULLIF(df.suma_ventas_5_semanas / 35, 0) <= 80 THEN '60-80'
                    WHEN df.inventario_mas_reciente / NULLIF(df.suma_ventas_5_semanas / 35, 0) <= 120 THEN '80-120'
                    WHEN df.inventario_mas_reciente / NULLIF(df.suma_ventas_5_semanas / 35, 0) <= 180 THEN '120-180'
                    ELSE 'mayor a 180'
                END AS rango_dias_inventario,
                CASE 
                    WHEN df.ultima_fecha_inventario < ufv.ultima_fecha_venta - INTERVAL '60 days' THEN 'inventario fantasma'
                    WHEN df.suma_ventas_5_semanas / 35 > 12 THEN 'AAA high runner'
                    WHEN df.suma_ventas_5_semanas / 35 > 6 THEN 'A'
                    WHEN df.suma_ventas_5_semanas / 35 > 3 THEN 'B'
                    WHEN df.suma_ventas_5_semanas / 35 > 1 THEN 'C'
                    WHEN df.suma_ventas_5_semanas / 35 > (1 / 7.0) THEN 'D-Low runner'
                    ELSE 'DDDD'
                END AS tipo_de_rotacion
            FROM 
                datos_filtrados df
            LEFT JOIN 
                ultima_fecha_venta_cte ufv
            ON 
                df.codigo_barras = ufv.codigo_barras AND df.codigo_tienda = ufv.codigo_tienda
        )
        SELECT 
            codigo_barras,
            codigo_tienda,
            suma_ventas_5_semanas,
            venta_diaria,
            inventario_mas_reciente,
            dias_inventario,
            ultima_fecha_inventario,
            ultima_fecha_venta,
            rango_dias_inventario,
            tipo_de_rotacion
        FROM 
            calculos;
    """

    async with app.state.db.acquire() as connection:
        rows = await connection.fetch(query)

    # Convertir resultados
    result = [
        {
            "codigo_barras": row["codigo_barras"],
            "codigo_tienda": row["codigo_tienda"],
            "suma_ventas_5_semanas": float(row["suma_ventas_5_semanas"]),
            "venta_diaria": float(row["venta_diaria"]),
            "inventario_mas_reciente": float(row["inventario_mas_reciente"]),
            "dias_inventario": float(row["dias_inventario"]) if row["dias_inventario"] is not None else None,
            "ultima_fecha_inventario": str(row["ultima_fecha_inventario"]),
            "ultima_fecha_venta": str(row["ultima_fecha_venta"]),
            "rango_dias_inventario": row["rango_dias_inventario"],
            "tipo_de_rotacion": row["tipo_de_rotacion"]
        }
        for row in rows
    ]
    return result


#------------------------------------------------------------------------------------------------------------------------------------------------



@app.get("/data_dia/")
async def get_data():
    query = """
        SELECT
            EXTRACT(YEAR FROM TO_DATE(fecha, 'DD/MM/YYYY')) AS ano,
            EXTRACT(WEEK FROM TO_DATE(fecha, 'DD/MM/YYYY')) AS semana,
            SUM(CAST(venta_unidades AS INTEGER)) AS total_venta_unidades
        FROM
            city_club
        GROUP BY
            fecha
    """
    rows = await app.state.db.fetch(query)

    result = [
        {
            "ano": row["ano"],
            "semana": row["semana"],
            "total_venta_unidades": row["total_venta_unidades"]
        }
        for row in rows
    ]
    return result



#------------------------------------------------------------------------------------------------------------------------------------------------
@app.get("/data_filt/")
async def get_ventas_por_mes(
    mes: Optional[int] = Query(default=None, description="Mes de la venta (opcional)"),
    ano: Optional[int] = Query(default=None, description="Año de la venta (opcional)")
):
    conn = None
    try:
        conn = await connect_to_db()

        # Construir la consulta SQL base con LEFT JOIN
        base_query = """
            SELECT 
                TO_DATE(cc.fecha, 'DD/MM/YYYY') AS fecha,
                EXTRACT(YEAR FROM TO_DATE(cc.fecha, 'DD/MM/YYYY')) AS ano,
                EXTRACT(WEEK FROM TO_DATE(cc.fecha, 'DD/MM/YYYY')) AS semana,
                SUM(CAST(cc.venta_unidades AS INTEGER)) AS suma_venta_unidades,
                SUM(CAST(cc.venta_pesos AS NUMERIC)) AS suma_venta_pesos,
                CASE 
                    WHEN SUM(CAST(cc.venta_unidades AS INTEGER)) > 0 THEN 
                        SUM(CAST(cc.venta_pesos AS NUMERIC)) / SUM(CAST(cc.venta_unidades AS INTEGER))
                    ELSE 
                        0
                END AS precio_promedio,
                m.marca,
                m.descripcion,
                m.segmento,
                m.pet
            FROM city_club cc
            LEFT JOIN master m
            ON cc.codigo_barras = m.upc
            WHERE 1=1
        """

        # Parámetros y ajustes a la consulta
        params = []
        placeholder_count = 1  # Contador para los placeholders ($1, $2, ...)

        if mes is not None:
            base_query += f" AND EXTRACT(MONTH FROM TO_DATE(cc.fecha, 'DD/MM/YYYY')) = ${placeholder_count}"
            params.append(mes)
            placeholder_count += 1

        if ano is not None:
            base_query += f" AND EXTRACT(YEAR FROM TO_DATE(cc.fecha, 'DD/MM/YYYY')) = ${placeholder_count}"
            params.append(ano)
            placeholder_count += 1

        # Añadir agrupación para sincronizar todas las métricas con fecha
        base_query += """
            GROUP BY 
                TO_DATE(cc.fecha, 'DD/MM/YYYY'), 
                EXTRACT(YEAR FROM TO_DATE(cc.fecha, 'DD/MM/YYYY')),
                EXTRACT(WEEK FROM TO_DATE(cc.fecha, 'DD/MM/YYYY')),
                m.marca,
                m.descripcion,
                m.segmento,
                m.pet
        """

        # Ejecutar la consulta con los parámetros
        rows = await conn.fetch(base_query, *params)

        # Convertir los resultados a un DataFrame
        loop = asyncio.get_running_loop()
        data = [dict(row) for row in rows]
        df = await loop.run_in_executor(None, pd.DataFrame, data)

        # Manejo de valores NaN e infinitos
        df = df.replace([float('inf'), -float('inf')], 0)  # Reemplaza valores infinitos con 0
        df = df.fillna(0)  # Reemplaza NaN con 0

        # Retornar el DataFrame como JSON para serializar la respuesta
        return df.to_dict(orient='records')

    except asyncpg.PostgresError as e:
        print("Database error:", e)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        print("Error general:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            await conn.close()

