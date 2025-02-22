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

// Показ текущего шага и скрытие остальных
function showStep(step) {
    document.querySelectorAll('.step').forEach(function(stepElement) {
        stepElement.style.display = 'none';
    });
    document.getElementById(`step${step}`).style.display = 'flex';

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

// Валидация данных на шаге 4
function validateStep4() {
    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const carNumberInput = document.getElementById('clientCarNumber');
    const nextButton = document.getElementById('next4');

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const carNumber = carNumberInput.value.trim();

    nextButton.disabled = !(name && phone && carNumber);
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
