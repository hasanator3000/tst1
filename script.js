// Функция для кнопки "Читать полностью"
function toggleReadMore() {
    const hiddenText = document.getElementById('hidden-text');
    const readFullButton = document.getElementById('text1');
    const hideButton = document.getElementById('hide-button');
    const gradientOverlay = document.getElementById('gradient-overlay');

    if (hiddenText.style.display === 'none') {
        hiddenText.style.display = 'block';
        readFullButton.style.display = 'none';
        hideButton.style.display = 'block';
        gradientOverlay.style.display = 'none';
    } else {
        hiddenText.style.display = 'none';
        readFullButton.style.display = 'block';
        hideButton.style.display = 'none';
        gradientOverlay.style.display = 'block';
    }
}

// Открытие модального окна
document.getElementById('fixed-button').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'flex';
    showStep(1);
});

// Закрытие модального окна
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Переход к следующему шагу
function nextStep(step) {
    showStep(step);
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
}

// Показ текущего шага и скрытие остальных
function showStep(step) {
    document.querySelectorAll('.step').forEach(function(stepElement) {
        stepElement.style.display = 'none';
    });
    document.getElementById(`step${step}`).style.display = 'flex';

    // Управление видимостью кнопки "Назад" и крестика
    const backButton = document.querySelector('.back-button');
    const closeButton = document.querySelector('.close-modal');

    if (step === 1) {
        backButton.style.display = 'none'; // На первом шаге скрываем кнопку "Назад"
        closeButton.style.display = 'block'; // Крестик отображается
    } else if (step === 5) {
        backButton.style.display = 'none'; // На последнем шаге скрываем кнопку "Назад"
        closeButton.style.display = 'none'; // Крестик скрываем
    } else {
        backButton.style.display = 'block'; // На остальных шагах показываем кнопку "Назад"
        closeButton.style.display = 'block'; // Крестик отображается
    }

    if (step === 4) {
        validateStep4();
        setupStep4Listeners();
    }
}

// Обновление списка моделей
function updateModels() {
    const brand = document.getElementById('brand').value;
    const modelSelect = document.getElementById('model');
    modelSelect.innerHTML = '<option value="">Выберите модель</option>';

    if (brand === 'BMW') {
        modelSelect.innerHTML += '<option value="X1">X1</option><option value="M5">M5</option>';
    } else if (brand === 'Porsche') {
        modelSelect.innerHTML += '<option value="911">911</option><option value="Panamera">Panamera</option>';
    }

    modelSelect.disabled = false;
    document.getElementById('next1').disabled = true;

    modelSelect.addEventListener('change', function() {
        if (modelSelect.value !== "") {
            document.getElementById('next1').disabled = false;
        } else {
            document.getElementById('next1').disabled = true;
        }
    });
}

// Обновление подытога
function updateTotal() {
    const services = document.querySelectorAll('input[name="service"]:checked');
    let total = 0;
    services.forEach(function(service) {
        total += parseInt(service.value);
    });
    document.getElementById('total').textContent = `${total}₽`;
    document.getElementById('next2').disabled = total === 0;
}

// Инициализация выбора времени
document.querySelectorAll('.time-slot').forEach(function(slot) {
    slot.addEventListener('click', function() {
        if (!slot.classList.contains('unavailable')) {
            document.querySelectorAll('.time-slot').forEach(function(s) {
                s.classList.remove('selected');
            });
            slot.classList.add('selected');
            document.getElementById('next3').disabled = false;
        }
    });
});

// Функция для автоматической капитализации первой буквы каждого слова
function capitalizeInput(input) {
    let value = input.value;

    if (!value) return;

    value = value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    input.value = value;
}

// Валидация поля "ФИО" (только буквы и пробелы)
function validateName(input) {
    input.value = input.value.replace(/[^а-яА-ЯёЁ\s]/g, ''); // Удаляем всё, кроме букв и пробелов
    capitalizeInput(input); // Применяем капитализацию
    validateStep4(); // Проверяем валидацию шага 4
}

// Форматирование номера телефона
function formatPhone(input) {
    // Удаляем всё, кроме цифр
    let phone = input.value.replace(/\D/g, '');

    // Если номер начинается с 7 или 8, заменяем на +7
    if (phone.startsWith('7') || phone.startsWith('8')) {
        phone = phone.substring(1); // Убираем первую цифру (7 или 8)
    }

    // Ограничиваем длину номера (10 цифр, без +7)
    if (phone.length > 10) {
        phone = phone.substring(0, 10);
    }

    // Форматируем номер по шаблону +7 (777) 777-77-77
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
    validateStep4(); // Проверяем валидацию шага 4
}

// Добавляем +7 при фокусе на поле ввода телефона
document.getElementById('clientPhone').addEventListener('focus', function() {
    const phoneInput = this;
    if (!phoneInput.value.startsWith('+7')) {
        phoneInput.value = '+7';
    }
});

// Функция для автоматической капитализации первой буквы каждого слова
function capitalizeInput(input) {
    input.value = input.value
        .toLowerCase() // Приводим весь текст к нижнему регистру
        .split(' ') // Разделяем строку по пробелам
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Капитализируем первую букву каждого слова
        .join(' '); // Соединяем слова обратно в строку
}

document.getElementById('clientName').addEventListener('paste', function(event) {
    event.preventDefault(); // Отменяем стандартное поведение вставки
    const pastedText = (event.clipboardData || window.clipboardData).getData('text'); // Получаем вставленный текст
    this.value = pastedText; // Вставляем текст в поле
    capitalizeInput(this); // Применяем функцию капитализации
});

// Валидация данных на шаге 4
function validateStep4() {
    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const carNumberInput = document.getElementById('clientCarNumber');
    const nextButton = document.getElementById('next4');

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const carNumber = carNumberInput.value.trim();

    // Проверяем, что номер телефона заполнен полностью
    const isPhoneValid = phone.length === 18; // +7 (777) 777-77-77

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

// Скрытие кнопки "Записаться сейчас" при прокрутке до черного поля
document.addEventListener('scroll', function() {
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

// Переменная для хранения текущего смещения дней
let currentDayOffset = 0;

// Функция для изменения дня
function changeDay(offset) {
    currentDayOffset += offset;
    updateDayDisplay();
}

// Функция для обновления отображения текущей даты
function updateDayDisplay() {
    const currentDayElement = document.getElementById('current-day');
    const today = new Date(); // Текущая дата
    today.setDate(today.getDate() + currentDayOffset); // Добавляем смещение

    // Форматируем дату в формате "ДД.ММ.ГГГГ"
    const formattedDate = today.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    currentDayElement.textContent = formattedDate; // Отображаем дату
}

// Инициализация выбора времени
document.querySelectorAll('.time-slot').forEach(function(slot) {
    slot.addEventListener('click', function() {
        if (!slot.classList.contains('unavailable')) {
            document.querySelectorAll('.time-slot').forEach(function(s) {
                s.classList.remove('selected');
            });
            slot.classList.add('selected');
            document.getElementById('next3').disabled = false;
        }
    });
});

// При показе шага 3 обновляем отображение даты
function showStep(step) {
    document.querySelectorAll('.step').forEach(function(stepElement) {
        stepElement.style.display = 'none';
    });
    document.getElementById(`step${step}`).style.display = 'flex';

    if (step === 3) {
        updateDayDisplay(); // Обновляем дату при открытии шага 3
    }

    // Управление видимостью кнопки "Назад" и крестика
    const backButton = document.querySelector('.back-button');
    const closeButton = document.querySelector('.close-modal');

    if (step === 1) {
        backButton.style.display = 'none'; // На первом шаге скрываем кнопку "Назад"
        closeButton.style.display = 'block'; // Крестик отображается
    } else if (step === 5) {
        backButton.style.display = 'none'; // На последнем шаге скрываем кнопку "Назад"
        closeButton.style.display = 'none'; // Крестик скрываем
    } else {
        backButton.style.display = 'block'; // На остальных шагах показываем кнопку "Назад"
        closeButton.style.display = 'block'; // Крестик отображается
    }

    if (step === 4) {
        validateStep4();
        setupStep4Listeners();
    }
}
