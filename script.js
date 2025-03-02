// ------------ Глобальные переменные ------------
let db; // База данных
let currentDayOffset = 0; // Смещение для выбора даты

// ------------ Общие функции интерфейса ------------

// Функция для кнопки "Читать полностью" и "Скрыть"
function toggleReadMore() {
    const hiddenText = document.getElementById('hidden-text');
    const readFullButton = document.getElementById('text1');
    const hideButton = document.getElementById('hide-button');
    const gradientOverlay = document.getElementById('gradient-overlay');

    if (hiddenText.classList.contains('open')) {
        // Закрываем текст
        hiddenText.classList.remove('open');
        gradientOverlay.style.opacity = '1'; // Показываем градиент
        readFullButton.style.display = 'block'; // Показываем кнопку "Читать полностью"
        hideButton.style.display = 'none'; // Скрываем кнопку "Скрыть"
    } else {
        // Открываем текст
        hiddenText.classList.add('open');
        gradientOverlay.style.opacity = '0'; // Скрываем градиент
        readFullButton.style.display = 'none'; // Скрываем кнопку "Читать полностью"
        hideButton.style.display = 'block'; // Показываем кнопку "Скрыть"
    }
}

// ------------ Функции для модального окна ------------

// Открытие модального окна
document.getElementById('fixed-button').addEventListener('click', function () {
    document.getElementById('modal').style.display = 'flex';
    showStep(1);
});

// Показ текущего шага и скрытие остальных
function showStep(step) {
    document.querySelectorAll('.step').forEach(function (stepElement) {
        stepElement.style.display = 'none';
    });
    document.getElementById(`step${step}`).style.display = 'flex';

    // Управление видимостью кнопки "Назад" и крестика
    const backButton = document.querySelector('.back-button');
    const closeButton = document.querySelector('.close-modal');

    if (step === 1) {
        backButton.style.display = 'none';
        closeButton.style.display = 'block';
    } else if (step === 5) {
        backButton.style.display = 'none';
        closeButton.style.display = 'none';
    } else {
        backButton.style.display = 'block';
        closeButton.style.display = 'block';
    }

    // Обновляем состояние кнопки "Подтвердить"
    updateConfirmButton();

    // Дополнительные действия для шага 4
    if (step === 4) {
        validateStep4();
        setupStep4Listeners();
    }
}

// Переход к следующему шагу
function nextStep() {
    const currentStep = document.querySelector('.step[style="display: flex;"]');
    if (!currentStep) return;

    const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
    const nextStepNumber = currentStepNumber + 1;

    if (nextStepNumber === 5) {
        saveAppointment(); // Если это последний шаг, сохраняем запись
    } else {
        showStep(nextStepNumber); // Переходим на следующий шаг
    }
}

// Переход на предыдущий шаг
function prevStep() {
    const currentStep = document.querySelector('.step[style="display: flex;"]');
    if (currentStep) {
        const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
        if (currentStepNumber > 1) {
            showStep(currentStepNumber - 1);
        }
    }
    updateConfirmButton(); // Обновляем состояние кнопки
}

// Функция для сброса модального окна
function resetModal() {
    // Сбрасываем выбор марки и модели
    document.getElementById('brand').selectedIndex = 0;
    document.getElementById('model').innerHTML = '<option value="">Выберите модель</option>';
    document.getElementById('model').disabled = true;

    // Сбрасываем выбор услуг
    const servicesContainer = document.getElementById('services-container');
    servicesContainer.innerHTML = '';
    document.getElementById('total').textContent = '0₽';

    // Сбрасываем выбор времени
    const timeSlotsContainer = document.querySelector('.time-slots');
    timeSlotsContainer.innerHTML = '';

    // Сбрасываем поля ввода данных клиента
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientCarNumber').value = '';

    // Сбрасываем состояние кнопок
    document.getElementById('next1').disabled = true;
    document.getElementById('next2').disabled = true;
    document.getElementById('next3').disabled = true;
    document.getElementById('next4').disabled = true;

    // Сбрасываем выбранный шаг
    showStep(1);
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    resetModal(); // Сбрасываем состояние модального окна
}

// ------------ Работа с данными ------------

// Заполнение выбора марок
function populateBrands(brands) {
    const brandSelect = document.getElementById('brand');
    brandSelect.innerHTML = '<option value="">Выберите марку</option>';

    if (!brands || !Array.isArray(brands)) {
        console.error("Ошибка: brands не определен или не является массивом");
        return;
    }

    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.id;
        option.textContent = brand.name;
        brandSelect.appendChild(option);
    });
}

// Заполнение выбора моделей
function populateModels(models) {
    const modelSelect = document.getElementById('model');
    modelSelect.innerHTML = '<option value="">Выберите модель</option>';
    modelSelect.disabled = true;

    if (!Array.isArray(models)) {
        console.error("Models не является массивом");
        return;
    }

    if (models.length === 0) {
        console.warn("Нет доступных моделей для выбранной марки");
        return;
    }

    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        modelSelect.appendChild(option);
    });

    modelSelect.disabled = false;
}

// Заполнение выбора услуг
function populateServices(services) {
    const servicesContainer = document.getElementById('services-container');
    servicesContainer.innerHTML = '';

    if (!services || !Array.isArray(services)) {
        console.error("Ошибка: services не определен или не является массивом");
        return;
    }

    if (services.length === 0) {
        console.warn("Нет доступных услуг для выбранной модели");
        servicesContainer.innerHTML = '<p>Услуги для данного авто пока что добавляются, скоро все исправим)</p>';
        return;
    }

    services.forEach(service => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" name="service" value="${service.id}" data-price="${service.price}" data-duration="${service.duration}" onchange="updateTotal()">
            ${service.name} (${service.price}₽, ${service.duration} мин)
        `;
        servicesContainer.appendChild(label);
    });
}

// Расчет временных слотов
function calculateTimeSlots(duration) {
    const slots = [];
    let startTime = new Date();
    startTime.setHours(9, 0, 0);

    while (startTime.getHours() < 20) {
        const endTime = new Date(startTime.getTime() + duration * 60000);
        slots.push({
            start: startTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            end: endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        });
        startTime = endTime;
    }

    return slots;
}

// Отображение временных слотов
function populateTimeSlots(duration) {
    const slots = calculateTimeSlots(duration);
    const timeSlotsContainer = document.querySelector('.time-slots');
    timeSlotsContainer.innerHTML = '';

    slots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'time-slot available';
        slotDiv.textContent = `${slot.start} - ${slot.end}`;

        // Обработчик клика для выбора/отмены выбора слота
        slotDiv.addEventListener('click', function () {
            const isSelected = this.classList.contains('selected');

            // Если слот уже выбран, снимаем выделение
            if (isSelected) {
                this.classList.remove('selected');
            } else {
                // Снимаем выделение со всех слотов
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                // Выделяем текущий слот
                this.classList.add('selected');
            }

            // Обновляем состояние кнопки "Подтвердить"
            updateConfirmButton();
        });

        timeSlotsContainer.appendChild(slotDiv);
    });
}

// Обновление подытога
function updateTotal() {
    const selectedServices = document.querySelectorAll('input[name="service"]:checked');
    let total = 0;
    let totalDuration = 0;

    // Считаем общую стоимость и длительность выбранных услуг
    selectedServices.forEach(service => {
        total += parseInt(service.dataset.price);
        totalDuration += parseInt(service.dataset.duration);
    });

    // Обновляем подытог
    document.getElementById('total').textContent = `${total}₽`;

    // Если выбрана хотя бы одна услуга, обновляем временные слоты
    if (selectedServices.length > 0) {
        populateTimeSlots(totalDuration);
    } else {
        // Если ни одна услуга не выбрана, очищаем временные слоты
        const timeSlotsContainer = document.querySelector('.time-slots');
        timeSlotsContainer.innerHTML = '';
    }

    // Обновляем состояние кнопки "Подтвердить"
    updateConfirmButton();
}

// ------------ Валидация и форматирование ------------

// Автоматическая капитализация первой буквы каждого слова
function capitalizeInput(input) {
    input.value = input.value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Валидация поля "ФИО" (только буквы и пробелы)
function validateName(input) {
    input.value = input.value.replace(/[^а-яА-ЯёЁ\s]/g, '');
    capitalizeInput(input);
    validateStep4();
}

// Форматирование номера телефона
function formatPhone(input) {
    let phone = input.value.replace(/\D/g, '');

    if (phone.startsWith('7') || phone.startsWith('8')) {
        phone = phone.substring(1);
    }

    if (phone.length > 10) {
        phone = phone.substring(0, 10);
    }

    let formattedPhone = '+7';
    if (phone.length > 0) {
        formattedPhone += ` (${phone.substring(0, 3)}`;
    }
    if (phone.length > 3) {
        formattedPhone += `) ${phone.substring(3, 6)}`;
    }
    if (phone.length > 6) {
        formattedPhone += `-${phone.substring(6, 8)}`;
    }
    if (phone.length > 8) {
        formattedPhone += `-${phone.substring(8, 10)}`;
    }

    input.value = formattedPhone;
    validateStep4();
}

// Валидация данных на шаге 4
function validateStep4() {
    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const carNumberInput = document.getElementById('clientCarNumber');
    const nextButton = document.getElementById('next4');

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const carNumber = carNumberInput.value.trim();

    const isPhoneValid = phone.length === 18;

    nextButton.disabled = !(name && isPhoneValid && carNumber);
}

// Добавляем обработчики событий для полей ввода на шаге 4
function setupStep4Listeners() {
    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const carNumberInput = document.getElementById('clientCarNumber');

    nameInput.addEventListener('input', validateStep4);
    phoneInput.addEventListener('input', validateStep4);
    carNumberInput.addEventListener('input', validateStep4);
}

// Обновление состояния кнопки "Подтвердить"
function updateConfirmButton() {
    const currentStep = document.querySelector('.step[style="display: flex;"]');
    if (!currentStep) return;

    const stepNumber = parseInt(currentStep.id.replace('step', ''));
    const confirmButton = document.getElementById(`next${stepNumber}`);

    switch (stepNumber) {
        case 1:
            // Шаг 1: Выбор марки и модели
            const brandSelected = document.getElementById('brand').value;
            const modelSelected = document.getElementById('model').value;
            confirmButton.disabled = !(brandSelected && modelSelected);
            break;

        case 2:
            // Шаг 2: Выбор услуг
            const servicesSelected = document.querySelectorAll('input[name="service"]:checked').length > 0;
            confirmButton.disabled = !servicesSelected;
            break;

        case 3:
            // Шаг 3: Выбор времени
            const timeSlotSelected = document.querySelector('.time-slot.selected');
            confirmButton.disabled = !timeSlotSelected;
            break;

        case 4:
            // Шаг 4: Ввод данных клиента
            validateStep4(); // Используем уже существующую функцию валидации
            break;

        default:
            confirmButton.disabled = false;
    }
}

// ------------ Инициализация и обработчики ------------

// Инициализация базы данных при открытии модального окна
document.getElementById('fixed-button').addEventListener('click', async function () {
    try {
        db = await dbFunctions.initDatabase();
        const brands = await dbFunctions.getBrands(db);
        populateBrands(brands);
        showStep(1);
    } catch (error) {
        console.error("Ошибка:", error);
    }
});

// Обновление моделей при выборе марки
document.getElementById('brand').addEventListener('change', async function () {
    try {
        const brandId = this.value;
        if (!brandId) {
            document.getElementById('model').disabled = true;
            document.getElementById('next1').disabled = true;
            return;
        }

        const models = await dbFunctions.getModels(db, brandId);
        populateModels(models);
        document.getElementById('model').disabled = false;
    } catch (error) {
        console.error("Ошибка при загрузке моделей:", error);
        document.getElementById('model').disabled = true;
        document.getElementById('next1').disabled = true;
    }
});

// Активация кнопки "Подтвердить" при выборе модели
document.getElementById('model').addEventListener('change', function () {
    const modelId = this.value;
    if (modelId) {
        document.getElementById('next1').disabled = false;
    } else {
        document.getElementById('next1').disabled = true;
    }
    updateConfirmButton(); // Обновляем состояние кнопки
});

// Получение услуг при выборе модели
document.getElementById('model').addEventListener('change', async function () {
    try {
        const modelId = this.value;
        if (!modelId) {
            return;
        }
        const services = await dbFunctions.getServices(db, modelId);
        populateServices(services);
    } catch (error) {
        console.error("Ошибка при загрузке услуг:", error);
    }
});

// Функция для получения марки и модели по ID модели
async function getBrandAndModelName(db, modelId) {
    try {
        const stmt = db.prepare(`
            SELECT b.name AS brandName, m.name AS modelName
            FROM models m
            JOIN brands b ON m.brand_id = b.id
            WHERE m.id = $modelId
        `);
        stmt.bind({ $modelId: modelId });
        const result = stmt.step() ? stmt.getAsObject() : null;
        stmt.free();
        return result ? `${result.brandName} ${result.modelName}` : "Неизвестная модель";
    } catch (error) {
        console.error("Ошибка при получении марки и модели:", error);
        return "Неизвестная модель";
    }
}

// Добавляем +7 при фокусе на поле ввода телефона
document.getElementById('clientPhone').addEventListener('focus', function () {
    const phoneInput = this;
    if (!phoneInput.value.startsWith('+7')) {
        phoneInput.value = '+7';
    }
});

// Обработка вставки текста в поле "ФИО"
document.getElementById('clientName').addEventListener('paste', function (event) {
    event.preventDefault();
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    this.value = pastedText;
    capitalizeInput(this);
});

// Скрытие кнопки "Записаться сейчас" при прокрутке до черного поля
document.addEventListener('scroll', function () {
    const fixedButton = document.getElementById('fixed-button');
    const aboutSection = document.querySelector('.about-section');
    const footer = document.querySelector('.footer');

    const aboutSectionRect = aboutSection.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();

    if (aboutSectionRect.top <= window.innerHeight || footerRect.top <= window.innerHeight) {
        fixedButton.classList.add('hidden');
    } else {
        fixedButton.classList.remove('hidden');
    }
});

// ------------ Вспомогательные функции ------------

// Функция для изменения дня
function changeDay(offset) {
    currentDayOffset += offset;
    updateDayDisplay();
}

// Функция для обновления отображения текущей даты
function updateDayDisplay() {
    const currentDayElement = document.getElementById('current-day');
    const today = new Date();
    today.setDate(today.getDate() + currentDayOffset);

    const formattedDate = today.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    currentDayElement.textContent = formattedDate;
}

// Инициализация выбора времени
document.querySelectorAll('.time-slot').forEach(function (slot) {
    slot.addEventListener('click', function () {
        if (!slot.classList.contains('unavailable')) {
            document.querySelectorAll('.time-slot').forEach(function (s) {
                s.classList.remove('selected');
            });
            slot.classList.add('selected');
            updateConfirmButton(); // Обновляем состояние кнопки
        }
    });
});

// ------------ Функция для сохранения записи ------------
async function saveAppointment() {
    if (!db) {
        console.error("База данных не инициализирована");
        return;
    }

    // Собираем данные из формы
    const clientName = document.getElementById('clientName').value;
    const clientPhone = document.getElementById('clientPhone').value;
    const clientCarNumber = document.getElementById('clientCarNumber').value;

    // Получаем выбранные услуги
    const selectedServices = Array.from(document.querySelectorAll('input[name="service"]:checked'))
        .map(service => service.value);

    // Получаем выбранное время
    const selectedTimeSlot = document.querySelector('.time-slot.selected');
    if (!selectedTimeSlot) {
        console.error("Время не выбрано");
        return;
    }
    const [startTime, endTime] = selectedTimeSlot.textContent.split(' - ');

    // Получаем выбранную модель
    const modelId = document.getElementById('model').value;

    // Получаем марку и модель
    const brandAndModelName = await getBrandAndModelName(db, modelId);

    // Создаем объект записи
    const appointment = {
        clientName,
        clientPhone,
        carNumber: clientCarNumber,
        model: brandAndModelName, // Используем название марки и модели
        services: selectedServices, // Используем ID услуг
        startTime,
        endTime,
        timestamp: new Date().toLocaleString() // Добавляем время создания записи
    };

    try {
        // Сохраняем запись в базу данных
        await dbFunctions.saveAppointment(db, clientName, clientPhone, clientCarNumber, modelId, selectedServices, startTime, endTime);
        
        // Сохраняем запись в LocalStorage
        saveAppointmentToLocalStorage(appointment);
        
        console.log("Запись успешно сохранена");
        showStep(5); // Переходим на шаг 5 (успешная запись)
    } catch (error) {
        console.error("Ошибка при сохранении записи:", error);
    }
}

// Функция для сохранения записи в LocalStorage
function saveAppointmentToLocalStorage(appointment) {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    console.log('Запись сохранена в LocalStorage:', appointment);
}

// Функция для получения всех записей из LocalStorage
function getAppointmentsFromLocalStorage() {
    const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    console.log('Записи из LocalStorage:', appointments);
    return appointments;
}

// Функция для скачивания данных в виде текстового файла
function downloadAppointmentsAsFile() {
    const appointments = getAppointmentsFromLocalStorage();

    // Преобразуем записи в текстовый формат
    const data = appointments.map(appointment => 
        `Имя: ${appointment.clientName}\n` +
        `Телефон: ${appointment.clientPhone}\n` +
        `Номер авто: ${appointment.carNumber}\n` +
        `Модель: ${appointment.model}\n` +
        `Услуги: ${appointment.services.join(', ')}\n` +
        `Время: ${appointment.startTime} - ${appointment.endTime}\n` +
        `Дата записи: ${appointment.timestamp}\n` +
        '---------------------------'
    ).join('\n');

    // Создаем Blob (бинарный объект) с данными
    const blob = new Blob([data], { type: 'text/plain' });

    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'appointments.txt'; // Имя файла
    link.click();

    // Освобождаем память
    URL.revokeObjectURL(link.href);
}

// Добавляем кнопку для скачивания файла
function addDownloadButton() {
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Скачать записи';
    downloadButton.addEventListener('click', downloadAppointmentsAsFile);
    document.body.appendChild(downloadButton);
}

// Вызов функции для добавления кнопки
addDownloadButton();
