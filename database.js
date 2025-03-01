// Инициализация SQL.js с безопасным режимом
async function initDatabase() {
    const sqlPromise = initSqlJs({
        // Указываем путь к файлам библиотеки (WASM и JS)
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
        // Включаем безопасный режим (используем WebAssembly вместо eval)
        disableWasm: false, // Убедитесь, что это false для использования WASM
    });

    // Загружаем файл базы данных
    const dataPromise = fetch('car_wash.db').then(res => res.arrayBuffer());

    // Инициализируем SQL.js и загружаем базу данных
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
    const db = new SQL.Database(new Uint8Array(buf));
    return db;
}

// Функция для получения марок авто
async function getBrands(db) {
    try {
        const stmt = db.prepare("SELECT * FROM brands");
        const brands = [];
        while (stmt.step()) {
            brands.push(stmt.getAsObject());
        }
        stmt.free();
        return brands;
    } catch (error) {
        console.error("Ошибка при загрузке марок:", error);
        return [];
    }
}

// Функция для получения моделей авто по марке
async function getModels(db, brandId) {
    try {
        const stmt = db.prepare("SELECT * FROM models WHERE brand_id = $brandId");
        stmt.bind({ $brandId: parseInt(brandId) }); // Преобразуем в число
        const models = [];
        while (stmt.step()) {
            models.push(stmt.getAsObject());
        }
        stmt.free();
        return models;
    } catch (error) {
        console.error("Ошибка при выполнении запроса:", error);
        return [];
    }
}

// Функция для получения услуг и цен по модели авто
async function getServices(db, modelId) {
    try {
        // Получаем класс автомобиля по модели
        const classStmt = db.prepare("SELECT class_id FROM models WHERE id = $modelId");
        classStmt.bind({ $modelId: parseInt(modelId) });
        const classResult = classStmt.step() ? classStmt.getAsObject() : null;
        classStmt.free();

        if (!classResult) {
            console.error("Класс автомобиля не найден");
            return [];
        }

        const classId = classResult.class_id;

        // Получаем услуги и цены для этого класса
        const stmt = db.prepare(`
            SELECT s.id, s.name, s.duration, p.price 
            FROM services s
            JOIN prices p ON s.id = p.service_id
            WHERE p.class_id = $classId
        `);
        stmt.bind({ $classId: classId });
        const services = [];
        while (stmt.step()) {
            services.push(stmt.getAsObject());
        }
        stmt.free();
        return services;
    } catch (error) {
        console.error("Ошибка при загрузке услуг:", error);
        return [];
    }
}
// Функция для сохранения записи
async function saveAppointment(db, clientName, clientPhone, carNumber, modelId, serviceIds, startTime, endTime) {
    try {
        const stmt = db.prepare(`
            INSERT INTO appointments (client_name, client_phone, car_number, model_id, service_ids, start_time, end_time)
            VALUES ($clientName, $clientPhone, $carNumber, $modelId, $serviceIds, $startTime, $endTime)
        `);
        stmt.bind({
            $clientName: clientName,
            $clientPhone: clientPhone,
            $carNumber: carNumber,
            $modelId: modelId,
            $serviceIds: serviceIds.join(','),
            $startTime: startTime,
            $endTime: endTime
        });
        stmt.step();
        stmt.free();
    } catch (error) {
        console.error("Ошибка при сохранении записи:", error);
    }
}

// Экспортируем функции для использования в других файлах
window.dbFunctions = { initDatabase, getBrands, getModels, getServices, saveAppointment };
