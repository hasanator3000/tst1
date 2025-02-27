// Инициализация SQL.js
async function initDatabase() {
    const sqlPromise = initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });

    const dataPromise = fetch('car_wash.db').then(res => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
    const db = new SQL.Database(new Uint8Array(buf));
    return db;
}

// Функция для получения марок авто
async function getBrands(db) {
    const stmt = db.prepare("SELECT * FROM brands");
    const brands = [];
    while (stmt.step()) {
        brands.push(stmt.getAsObject());
    }
    stmt.free();
    return brands;
}

// Функция для получения моделей авто по марке
async function getModels(db, brandId) {
    const stmt = db.prepare("SELECT * FROM models WHERE brand_id = :brandId");
    stmt.bind({ ':brandId': brandId });
    const models = [];
    while (stmt.step()) {
        models.push(stmt.getAsObject());
    }
    stmt.free();
    return models;
}

// Функция для получения услуг и цен по модели авто
async function getServices(db, modelId) {
    const stmt = db.prepare(`
        SELECT s.id, s.name, s.duration, p.price 
        FROM services s
        JOIN prices p ON s.id = p.service_id
        WHERE p.model_id = :modelId
    `);
    stmt.bind({ ':modelId': modelId });
    const services = [];
    while (stmt.step()) {
        services.push(stmt.getAsObject());
    }
    stmt.free();
    return services;
}

// Функция для сохранения записи
async function saveAppointment(db, clientName, clientPhone, carNumber, modelId, serviceIds, startTime, endTime) {
    const stmt = db.prepare(`
        INSERT INTO appointments (client_name, client_phone, car_number, model_id, service_ids, start_time, end_time)
        VALUES (:clientName, :clientPhone, :carNumber, :modelId, :serviceIds, :startTime, :endTime)
    `);
    stmt.bind({
        ':clientName': clientName,
        ':clientPhone': clientPhone,
        ':carNumber': carNumber,
        ':modelId': modelId,
        ':serviceIds': serviceIds.join(','),
        ':startTime': startTime,
        ':endTime': endTime
    });
    stmt.step();
    stmt.free();
}

// Экспортируем функции
window.dbFunctions = { initDatabase, getBrands, getModels, getServices, saveAppointment };
