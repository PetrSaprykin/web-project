let allCourses = [];
let filteredCourses = [];
let allTutors = [];
let filteredTutors = [];

const COURSES_PER_PAGE = 3;
let currentCoursePage = 1;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadCourses();
        await loadTutors();
        initializeSearch();
        initializeYandexMap();
    } catch (error) {
        console.error('Initialization error:', error);
        Notifications.error('Ошибка загрузки данных. Попробуйте обновить страницу.');
    }
});


async function loadCourses() {
    try {
        allCourses = await API.getCourses();
        filteredCourses = [...allCourses];
        displayCourses();
    } catch (error) {
        console.error('Error loading courses:', error);
        Notifications.error('Не удалось загрузить курсы');
    }
}


function displayCourses() {
    const coursesList = document.getElementById('courses-list');
    coursesList.innerHTML = '';

    const startIndex = (currentCoursePage - 1) * COURSES_PER_PAGE;
    const endIndex = startIndex + COURSES_PER_PAGE;
    const coursesToDisplay = filteredCourses.slice(startIndex, endIndex);

    if (coursesToDisplay.length === 0) {
        coursesList.innerHTML = '<div class="col-12"><p class="text-center">Курсы не найдены</p></div>';
        return;
    }

    coursesToDisplay.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesList.appendChild(courseCard);
    });

    displayCoursesPagination();
}


function createCourseCard(course) {
    const col = document.createElement('div');
    col.className = 'col-md-4';

    col.innerHTML = `
        <div class="card h-100">
            <div class="card-body">
                <h5 class="card-title">${course.name}</h5>
                <p class="card-text">${course.description}</p>
                <p class="mb-1"><strong>Преподаватель:</strong> ${course.teacher}</p>
                <p class="mb-1"><strong>Уровень:</strong> ${course.level}</p>
                <p class="mb-1"><strong>Продолжительность:</strong> ${course.total_length} недель</p>
                <p class="mb-3"><strong>Стоимость:</strong> ${course.course_fee_per_hour} руб./час</p>
                <button class="btn btn-primary" onclick="openCourseRequestModal(${course.id})">
                    Подать заявку
                </button>
            </div>
        </div>
    `;

    return col;
}


function displayCoursesPagination() {
    const pagination = document.getElementById('courses-pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);

    if (totalPages <= 1) return;

    
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentCoursePage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#courses">Назад</a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentCoursePage > 1) {
            currentCoursePage--;
            displayCourses();
            document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
        }
    });
    pagination.appendChild(prevLi);

    
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentCoursePage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#courses">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentCoursePage = i;
            displayCourses();
            document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
        });
        pagination.appendChild(li);
    }

    
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentCoursePage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#courses">Вперёд</a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentCoursePage < totalPages) {
            currentCoursePage++;
            displayCourses();
            document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
        }
    });
    pagination.appendChild(nextLi);
}


async function loadTutors() {
    try {
        allTutors = await API.getTutors();
        filteredTutors = [...allTutors];
        populateLanguageFilter();
        displayTutors();
    } catch (error) {
        console.error('Error loading tutors:', error);
        Notifications.error('Не удалось загрузить репетиторов');
    }
}


function populateLanguageFilter() {
    const languageSelect = document.getElementById('tutor-search-language');
    const languages = new Set();

    allTutors.forEach(tutor => {
        tutor.languages_offered.forEach(lang => languages.add(lang));
    });

    Array.from(languages).sort().forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        languageSelect.appendChild(option);
    });
}


function displayTutors() {
    const tutorsList = document.getElementById('tutors-list');
    tutorsList.innerHTML = '';

    if (filteredTutors.length === 0) {
        tutorsList.innerHTML = '<tr><td colspan="6" class="text-center">Репетиторы не найдены</td></tr>';
        return;
    }

    filteredTutors.forEach(tutor => {
        const row = createTutorRow(tutor);
        tutorsList.appendChild(row);
    });
}


function createTutorRow(tutor) {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
        <td>${tutor.name}</td>
        <td>${tutor.language_level}</td>
        <td>${tutor.languages_offered.join(', ')}</td>
        <td>${tutor.work_experience}</td>
        <td>${tutor.price_per_hour}</td>
        <td>
            <button class="btn btn-success btn-sm" onclick="openTutorRequestModal(${tutor.id})">
                Выбрать
            </button>
        </td>
    `;

    return tr;
}


function initializeSearch() {
    
    const courseNameInput = document.getElementById('course-search-name');
    const courseLevelSelect = document.getElementById('course-search-level');

    courseNameInput.addEventListener('input', filterCourses);
    courseLevelSelect.addEventListener('change', filterCourses);

    
    const tutorLanguageSelect = document.getElementById('tutor-search-language');
    const tutorExperienceInput = document.getElementById('tutor-search-experience');

    tutorLanguageSelect.addEventListener('change', filterTutors);
    tutorExperienceInput.addEventListener('input', filterTutors);
}


function filterCourses() {
    const nameQuery = document.getElementById('course-search-name').value.toLowerCase().trim();
    const levelQuery = document.getElementById('course-search-level').value;

    filteredCourses = allCourses.filter(course => {
        const matchesName = !nameQuery || course.name.toLowerCase().includes(nameQuery);
        const matchesLevel = !levelQuery || course.level === levelQuery;
        return matchesName && matchesLevel;
    });

    currentCoursePage = 1;
    displayCourses();
}


function filterTutors() {
    const languageQuery = document.getElementById('tutor-search-language').value;
    const experienceQuery = parseInt(document.getElementById('tutor-search-experience').value) || 0;

    filteredTutors = allTutors.filter(tutor => {
        const matchesLanguage = !languageQuery || tutor.languages_offered.includes(languageQuery);
        const matchesExperience = !experienceQuery || tutor.work_experience >= experienceQuery;
        return matchesLanguage && matchesExperience;
    });

    displayTutors();
}


async function openCourseRequestModal(courseId) {
    try {
        const course = await API.getCourse(courseId);
        const modal = new bootstrap.Modal(document.getElementById('requestModal'));
        
        document.getElementById('requestModalTitle').textContent = 'Оформление заявки на курс';
        
        const formContent = document.getElementById('form-content');
        formContent.innerHTML = `
            <input type="hidden" id="request-type" value="course">
            <input type="hidden" id="request-id" value="${course.id}">
            
            <div class="mb-3">
                <label class="form-label">Название курса</label>
                <input type="text" class="form-control" value="${course.name}" readonly>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Преподаватель</label>
                <input type="text" class="form-control" value="${course.teacher}" readonly>
            </div>
            
            <div class="mb-3">
                <label for="start-date" class="form-label">Дата начала курса *</label>
                <select id="start-date" class="form-select" required>
                    <option value="">Выберите дату</option>
                    ${course.start_dates.map(date => {
                        const dateObj = new Date(date);
                        const dateStr = dateObj.toLocaleDateString('ru-RU');
                        return `<option value="${date}">${dateStr}</option>`;
                    }).join('')}
                </select>
            </div>
            
            <div class="mb-3">
                <label for="start-time" class="form-label">Время занятий *</label>
                <select id="start-time" class="form-select" required disabled>
                    <option value="">Сначала выберите дату</option>
                </select>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Продолжительность курса</label>
                <input type="text" class="form-control" value="${course.total_length} недель" readonly>
                <small class="text-muted" id="end-date-display"></small>
            </div>
            
            <div class="mb-3">
                <label for="students-number" class="form-label">Количество студентов *</label>
                <input type="number" id="students-number" class="form-control" min="1" max="20" value="1" required>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Дополнительные опции</label>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="opt-supplementary">
                    <label class="form-check-label" for="opt-supplementary">
                        Дополнительные учебные материалы (+2000 руб. за студента)
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="opt-personalized">
                    <label class="form-check-label" for="opt-personalized">
                        Индивидуальные занятия (+1500 руб. за неделю)
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="opt-excursions">
                    <label class="form-check-label" for="opt-excursions">
                        Культурные экскурсии (+25% к стоимости)
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="opt-assessment">
                    <label class="form-check-label" for="opt-assessment">
                        Оценка уровня владения языком (+300 руб.)
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="opt-interactive">
                    <label class="form-check-label" for="opt-interactive">
                        Доступ к интерактивной онлайн-платформе (+50% к стоимости)
                    </label>
                </div>
            </div>
            
            <div id="auto-discounts" class="mb-3">
                <!-- Auto discounts will be displayed here -->
            </div>
        `;
        
        
        setupCourseFormListeners(course);
        
        modal.show();
    } catch (error) {
        console.error('Error opening course modal:', error);
        Notifications.error('Не удалось загрузить данные курса');
    }
}


function setupCourseFormListeners(course) {
    const startDateSelect = document.getElementById('start-date');
    const startTimeSelect = document.getElementById('start-time');
    const studentsInput = document.getElementById('students-number');
    
    
    startDateSelect.addEventListener('change', () => {
        populateTimeSlots(course, startDateSelect.value);
        calculateCoursePrice(course);
    });
    
    
    startTimeSelect.addEventListener('change', () => calculateCoursePrice(course));
    studentsInput.addEventListener('input', () => calculateCoursePrice(course));
    
    
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => calculateCoursePrice(course));
    });
}


function populateTimeSlots(course, selectedDate) {
    const startTimeSelect = document.getElementById('start-time');
    startTimeSelect.innerHTML = '<option value="">Выберите время</option>';
    startTimeSelect.disabled = false;
    
    
    const timesForDate = course.start_dates.filter(dateTime => {
        return dateTime.startsWith(selectedDate.split('T')[0]);
    });
    
    timesForDate.forEach(dateTime => {
        const timeObj = new Date(dateTime);
        const hours = String(timeObj.getHours()).padStart(2, '0');
        const minutes = String(timeObj.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;
        
        
        const endTime = new Date(timeObj.getTime() + course.week_length * 60 * 60 * 1000);
        const endHours = String(endTime.getHours()).padStart(2, '0');
        const endMinutes = String(endTime.getMinutes()).padStart(2, '0');
        const endTimeStr = `${endHours}:${endMinutes}`;
        
        const option = document.createElement('option');
        option.value = timeStr;
        option.textContent = `${timeStr} - ${endTimeStr}`;
        startTimeSelect.appendChild(option);
    });
}


function calculateCoursePrice(course) {
    const startDate = document.getElementById('start-date').value;
    const startTime = document.getElementById('start-time').value;
    const studentsNumber = parseInt(document.getElementById('students-number').value) || 1;
    
    if (!startDate || !startTime) {
        document.getElementById('total-price').textContent = '0';
        return;
    }
    
    
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + (course.total_length * 7));
    document.getElementById('end-date-display').textContent = 
        `Дата окончания: ${endDateObj.toLocaleDateString('ru-RU')}`;
    
    
    const durationInHours = course.total_length * course.week_length;
    let totalPrice = course.course_fee_per_hour * durationInHours;
    
    
    const dayOfWeek = startDateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) {
        totalPrice *= 1.5;
    }
    
    
    const [hours] = startTime.split(':').map(Number);
    if (hours >= 9 && hours < 12) {
        totalPrice += 400;
    }
    
    
    if (hours >= 18 && hours < 20) {
        totalPrice += 1000;
    }
    
    
    totalPrice *= studentsNumber;
    
    
    const autoDiscounts = document.getElementById('auto-discounts');
    autoDiscounts.innerHTML = '';
    
    
    const today = new Date();
    const monthAhead = new Date(today);
    monthAhead.setMonth(monthAhead.getMonth() + 1);
    
    let earlyRegistration = false;
    if (startDateObj >= monthAhead) {
        earlyRegistration = true;
        totalPrice *= 0.9;
        autoDiscounts.innerHTML += '<div class="alert alert-success py-2">✓ Скидка за раннюю регистрацию: -10%</div>';
    }
    
    
    let groupEnrollment = false;
    if (studentsNumber >= 5) {
        groupEnrollment = true;
        totalPrice *= 0.85;
        autoDiscounts.innerHTML += '<div class="alert alert-success py-2">✓ Скидка за групповую запись: -15%</div>';
    }
    
    
    let intensiveCourse = false;
    if (course.week_length >= 5) {
        intensiveCourse = true;
        totalPrice *= 1.2;
        autoDiscounts.innerHTML += '<div class="alert alert-warning py-2">! Интенсивный курс: +20%</div>';
    }
    
    
    if (document.getElementById('opt-supplementary').checked) {
        totalPrice += 2000 * studentsNumber;
    }
    
    if (document.getElementById('opt-personalized').checked) {
        totalPrice += 1500 * course.total_length;
    }
    
    if (document.getElementById('opt-excursions').checked) {
        totalPrice *= 1.25;
    }
    
    if (document.getElementById('opt-assessment').checked) {
        totalPrice += 300;
    }
    
    if (document.getElementById('opt-interactive').checked) {
        totalPrice *= 1.5;
    }
    
    document.getElementById('total-price').textContent = Math.round(totalPrice);
}


async function openTutorRequestModal(tutorId) {
    try {
        const tutor = await API.getTutor(tutorId);
        const modal = new bootstrap.Modal(document.getElementById('requestModal'));
        
        document.getElementById('requestModalTitle').textContent = 'Запрос на занятие с репетитором';
        
        const formContent = document.getElementById('form-content');
        formContent.innerHTML = `
            <input type="hidden" id="request-type" value="tutor">
            <input type="hidden" id="request-id" value="${tutor.id}">
            
            <div class="mb-3">
                <label class="form-label">Имя репетитора</label>
                <input type="text" class="form-control" value="${tutor.name}" readonly>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Ваше имя *</label>
                <input type="text" id="student-name" class="form-control" required>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Email *</label>
                <input type="email" id="student-email" class="form-control" required>
            </div>
            
            <div class="mb-3">
                <label for="tutor-date" class="form-label">Дата занятия *</label>
                <input type="date" id="tutor-date" class="form-control" required min="${new Date().toISOString().split('T')[0]}">
            </div>
            
            <div class="mb-3">
                <label for="tutor-time" class="form-label">Время начала *</label>
                <input type="time" id="tutor-time" class="form-control" required>
            </div>
            
            <div class="mb-3">
                <label for="tutor-duration" class="form-label">Продолжительность (часов) *</label>
                <input type="number" id="tutor-duration" class="form-control" min="1" max="40" value="1" required>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Сообщение</label>
                <textarea id="tutor-message" class="form-control" rows="3" placeholder="Опишите ваши цели обучения..."></textarea>
            </div>
        `;
        
        
        document.getElementById('tutor-duration').addEventListener('input', () => {
            const duration = parseInt(document.getElementById('tutor-duration').value) || 1;
            const price = tutor.price_per_hour * duration;
            document.getElementById('total-price').textContent = price;
        });
        
        
        document.getElementById('total-price').textContent = tutor.price_per_hour;
        
        modal.show();
    } catch (error) {
        console.error('Error opening tutor modal:', error);
        Notifications.error('Не удалось загрузить данные репетитора');
    }
}


document.getElementById('submit-request').addEventListener('click', async () => {
    const requestType = document.getElementById('request-type').value;
    
    if (requestType === 'course') {
        await submitCourseRequest();
    } else {
        await submitTutorRequest();
    }
});


async function submitCourseRequest() {
    const courseId = parseInt(document.getElementById('request-id').value);
    const startDate = document.getElementById('start-date').value;
    const startTime = document.getElementById('start-time').value;
    const studentsNumber = parseInt(document.getElementById('students-number').value);
    
    if (!startDate || !startTime || !studentsNumber) {
        Notifications.warning('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    
    const course = await API.getCourse(courseId);
    const duration = course.total_length * course.week_length;
    
    
    const startDateObj = new Date(startDate);
    const today = new Date();
    const monthAhead = new Date(today);
    monthAhead.setMonth(monthAhead.getMonth() + 1);
    
    const orderData = {
        course_id: courseId,
        tutor_id: 0,
        date_start: startDate.split('T')[0],
        time_start: startTime,
        duration: duration,
        persons: studentsNumber,
        price: parseInt(document.getElementById('total-price').textContent),
        early_registration: startDateObj >= monthAhead,
        group_enrollment: studentsNumber >= 5,
        intensive_course: course.week_length >= 5,
        supplementary: document.getElementById('opt-supplementary').checked,
        personalized: document.getElementById('opt-personalized').checked,
        excursions: document.getElementById('opt-excursions').checked,
        assessment: document.getElementById('opt-assessment').checked,
        interactive: document.getElementById('opt-interactive').checked
    };
    
    try {
        await API.createOrder(orderData);
        Notifications.success('Заявка успешно оформлена!');
        bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
    } catch (error) {
        console.error('Error submitting course request:', error);
        Notifications.error('Ошибка при оформлении заявки. Попробуйте снова.');
    }
}

async function submitTutorRequest() {
    const tutorId = parseInt(document.getElementById('request-id').value);
    const date = document.getElementById('tutor-date').value;
    const time = document.getElementById('tutor-time').value;
    const duration = parseInt(document.getElementById('tutor-duration').value);
    
    if (!date || !time || !duration) {
        Notifications.warning('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    const orderData = {
        tutor_id: tutorId,
        course_id: 0,
        date_start: date,
        time_start: time,
        duration: duration,
        persons: 1,
        price: parseInt(document.getElementById('total-price').textContent),
        early_registration: false,
        group_enrollment: false,
        intensive_course: false,
        supplementary: false,
        personalized: false,
        excursions: false,
        assessment: false,
        interactive: false
    };
    
    try {
        await API.createOrder(orderData);
        Notifications.success('Заявка на занятие с репетитором успешно оформлена!');
        bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
    } catch (error) {
        console.error('Error submitting tutor request:', error);
        Notifications.error('Ошибка при оформлении заявки. Попробуйте снова.');
    }
}

function initializeYandexMap() {
    if (typeof window.initializeYandexMap !== 'undefined') {
        window.initializeYandexMap();
    }
}
