let allOrders = [];
const ORDERS_PER_PAGE = 5;
let currentOrderPage = 1;
let orderToDelete = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadOrders();
  } catch (error) {
    console.error("Initialization error:", error);
    Notifications.error(
      "Ошибка загрузки данных. Попробуйте обновить страницу."
    );
  }
});

// загружаем заказы пользователя
async function loadOrders() {
  try {
    allOrders = await API.getOrders();
    displayOrders();
  } catch (error) {
    console.error("Error loading orders:", error);
    Notifications.error("Не удалось загрузить заявки");
  }
}

// отображаем заказы с пагинацией
function displayOrders() {
  const ordersList = document.getElementById("orders-list");
  ordersList.innerHTML = "";

  if (allOrders.length === 0) {
    ordersList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <p class="mb-0">У вас пока нет заявок</p>
                    <a href="index.html" class="btn btn-primary mt-2">Перейти к курсам</a>
                </td>
            </tr>
        `;
    document.getElementById("orders-pagination").innerHTML = "";
    return;
  }

  const startIndex = (currentOrderPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const ordersToDisplay = allOrders.slice(startIndex, endIndex);

  ordersToDisplay.forEach((order) => {
    const row = createOrderRow(order);
    ordersList.appendChild(row);
  });

  displayOrdersPagination();
}

// создаём строку заказа
function createOrderRow(order) {
  const tr = document.createElement("tr");

  // вычисляем тип заказа и начальное название
  const orderType = order.course_id !== 0 ? "course" : "tutor";
  const courseName =
    orderType === "course" ? "Загрузка..." : "Занятие с репетитором";

  tr.innerHTML = `
        <td>${order.id}</td>
        <td id="order-name-${order.id}">${courseName}</td>
        <td>${new Date(order.date_start).toLocaleDateString("ru-RU")}</td>
        <td>${order.price} руб.</td>
        <td>
            <button class="btn btn-info btn-sm me-1" onclick="showOrderDetails(${
              order.id
            })">
                Подробнее
            </button>
            <button class="btn btn-warning btn-sm me-1" onclick="editOrder(${
              order.id
            })">
                Изменить
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteOrder(${
              order.id
            })">
                Удалить
            </button>
        </td>
    `;

  // асинхрнно загружаем название курса или имя репетитора
  if (orderType === "course") {
    API.getCourse(order.course_id)
      .then((course) => {
        const nameCell = document.getElementById(`order-name-${order.id}`);
        if (nameCell) {
          nameCell.textContent = course.name;
        }
      })
      .catch(() => {
        const nameCell = document.getElementById(`order-name-${order.id}`);
        if (nameCell) {
          nameCell.textContent = "Курс";
        }
      });
  } else {
    API.getTutor(order.tutor_id)
      .then((tutor) => {
        const nameCell = document.getElementById(`order-name-${order.id}`);
        if (nameCell) {
          nameCell.textContent = `Репетитор: ${tutor.name}`;
        }
      })
      .catch(() => {
        const nameCell = document.getElementById(`order-name-${order.id}`);
        if (nameCell) {
          nameCell.textContent = "Занятие с репетитором";
        }
      });
  }

  return tr;
}

// отображаем пагинацию для заказа
function displayOrdersPagination() {
  const pagination = document.getElementById("orders-pagination");
  pagination.innerHTML = "";

  const totalPages = Math.ceil(allOrders.length / ORDERS_PER_PAGE);

  if (totalPages <= 1) return;

  // пред. кнопка
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentOrderPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `<a class="page-link" href="#">Назад</a>`;
  prevLi.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentOrderPage > 1) {
      currentOrderPage--;
      displayOrders();
    }
  });
  pagination.appendChild(prevLi);

  // номера страниц
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentOrderPage ? "active" : ""}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener("click", (e) => {
      e.preventDefault();
      currentOrderPage = i;
      displayOrders();
    });
    pagination.appendChild(li);
  }

  // следующая кнопка
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${
    currentOrderPage === totalPages ? "disabled" : ""
  }`;
  nextLi.innerHTML = `<a class="page-link" href="#">Вперёд</a>`;
  nextLi.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentOrderPage < totalPages) {
      currentOrderPage++;
      displayOrders();
    }
  });
  pagination.appendChild(nextLi);
}

// показать детали заказа
async function showOrderDetails(orderId) {
  try {
    const order = await API.getOrder(orderId);
    const modal = new bootstrap.Modal(document.getElementById("detailsModal"));
    const detailsContent = document.getElementById("details-content");

    let courseName = "";
    let courseInfo = "";

    if (order.course_id !== 0) {
      const course = await API.getCourse(order.course_id);
      courseName = course.name;
      courseInfo = `
                <p><strong>Описание:</strong> ${course.description}</p>
                <p><strong>Преподаватель:</strong> ${course.teacher}</p>
                <p><strong>Уровень:</strong> ${course.level}</p>
            `;
    } else {
      const tutor = await API.getTutor(order.tutor_id);
      courseName = `Занятие с репетитором ${tutor.name}`;
      courseInfo = `
                <p><strong>Опыт работы:</strong> ${
                  tutor.work_experience
                } лет</p>
                <p><strong>Языки:</strong> ${tutor.languages_offered.join(
                  ", "
                )}</p>
                <p><strong>Уровень:</strong> ${tutor.language_level}</p>
            `;
    }

    // считаем скидки и опции
    let optionsHtml = '<h6 class="mt-3">Выбранные опции:</h6><ul>';

    if (order.early_registration) {
      optionsHtml += "<li>✓ Скидка за раннюю регистрацию (-10%)</li>";
    }
    if (order.group_enrollment) {
      optionsHtml += "<li>✓ Скидка за групповую запись (-15%)</li>";
    }
    if (order.intensive_course) {
      optionsHtml += "<li>✓ Интенсивный курс (+20%)</li>";
    }
    if (order.supplementary) {
      optionsHtml += "<li>✓ Дополнительные учебные материалы</li>";
    }
    if (order.personalized) {
      optionsHtml += "<li>✓ Индивидуальные занятия</li>";
    }
    if (order.excursions) {
      optionsHtml += "<li>✓ Культурные экскурсии</li>";
    }
    if (order.assessment) {
      optionsHtml += "<li>✓ Оценка уровня владения языком</li>";
    }
    if (order.interactive) {
      optionsHtml += "<li>✓ Доступ к интерактивной платформе</li>";
    }

    optionsHtml += "</ul>";

    detailsContent.innerHTML = `
            <h6>Информация о заявке</h6>
            <p><strong>Номер заявки:</strong> ${order.id}</p>
            <p><strong>Название:</strong> ${courseName}</p>
            ${courseInfo}
            <p><strong>Дата начала:</strong> ${new Date(
              order.date_start
            ).toLocaleDateString("ru-RU")}</p>
            <p><strong>Время начала:</strong> ${order.time_start}</p>
            <p><strong>Продолжительность:</strong> ${order.duration} часов</p>
            <p><strong>Количество студентов:</strong> ${order.persons}</p>
            ${optionsHtml}
            <hr>
            <h5><strong>Общая стоимость:</strong> ${order.price} руб.</h5>
        `;

    modal.show();
  } catch (error) {
    console.error("Error showing order details:", error);
    Notifications.error("Не удалось загрузить информацию о заявке");
  }
}

// редактирем заказ
async function editOrder(orderId) {
  try {
    const order = await API.getOrder(orderId);
    const modal = new bootstrap.Modal(document.getElementById("editModal"));

    document.getElementById("edit-order-id").value = order.id;

    if (order.course_id !== 0) {
      await loadCourseEditForm(order);
    } else {
      await loadTutorEditForm(order);
    }

    modal.show();
  } catch (error) {
    console.error("Error loading edit form:", error);
    Notifications.error("Не удалось загрузить форму редактирования");
  }
}

// грузим форму редактирования курса
async function loadCourseEditForm(order) {
  const course = await API.getCourse(order.course_id);
  const formContent = document.getElementById("edit-form-content");

  formContent.innerHTML = `
        <input type="hidden" id="edit-type" value="course">
        <input type="hidden" id="edit-course-id" value="${course.id}">
        
        <div class="mb-3">
            <label class="form-label">Название курса</label>
            <input type="text" class="form-control" value="${
              course.name
            }" readonly>
        </div>
        
        <div class="mb-3">
            <label class="form-label">Преподаватель</label>
            <input type="text" class="form-control" value="${
              course.teacher
            }" readonly>
        </div>
        
        <div class="mb-3">
            <label for="edit-start-date" class="form-label">Дата начала курса *</label>
            <select id="edit-start-date" class="form-select" required>
                <option value="">Выберите дату</option>
                ${course.start_dates
                  .map((date) => {
                    const dateObj = new Date(date);
                    const dateStr = dateObj.toLocaleDateString("ru-RU");
                    const selected = date.startsWith(order.date_start)
                      ? "selected"
                      : "";
                    return `<option value="${date}" ${selected}>${dateStr}</option>`;
                  })
                  .join("")}
            </select>
        </div>
        
        <div class="mb-3">
            <label for="edit-start-time" class="form-label">Время занятий *</label>
            <select id="edit-start-time" class="form-select" required>
                <option value="">Выберите время</option>
            </select>
        </div>
        
        <div class="mb-3">
            <label class="form-label">Продолжительность курса</label>
            <input type="text" class="form-control" value="${
              course.total_length
            } недель" readonly>
            <small class="text-muted" id="edit-end-date-display"></small>
        </div>
        
        <div class="mb-3">
            <label for="edit-students-number" class="form-label">Количество студентов *</label>
            <input type="number" id="edit-students-number" class="form-control" min="1" max="20" value="${
              order.persons
            }" required>
        </div>
        
        <div class="mb-3">
            <label class="form-label">Дополнительные опции</label>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="edit-opt-supplementary" ${
                  order.supplementary ? "checked" : ""
                }>
                <label class="form-check-label" for="edit-opt-supplementary">
                    Дополнительные учебные материалы (+2000 руб. за студента)
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="edit-opt-personalized" ${
                  order.personalized ? "checked" : ""
                }>
                <label class="form-check-label" for="edit-opt-personalized">
                    Индивидуальные занятия (+1500 руб. за неделю)
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="edit-opt-excursions" ${
                  order.excursions ? "checked" : ""
                }>
                <label class="form-check-label" for="edit-opt-excursions">
                    Культурные экскурсии (+25% к стоимости)
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="edit-opt-assessment" ${
                  order.assessment ? "checked" : ""
                }>
                <label class="form-check-label" for="edit-opt-assessment">
                    Оценка уровня владения языком (+300 руб.)
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="edit-opt-interactive" ${
                  order.interactive ? "checked" : ""
                }>
                <label class="form-check-label" for="edit-opt-interactive">
                    Доступ к интерактивной онлайн-платформе (+50% к стоимости)
                </label>
            </div>
        </div>
        
        <div id="edit-auto-discounts" class="mb-3">
            <!-- Auto discounts will be displayed here -->
        </div>
    `;

  populateEditTimeSlots(course, order.date_start, order.time_start);

  setupEditCourseFormListeners(course);

  calculateEditCoursePrice(course);
}

// пополняем слоты времени при редактировании курса
function populateEditTimeSlots(course, selectedDate, currentTime) {
  const startTimeSelect = document.getElementById("edit-start-time");
  startTimeSelect.innerHTML = '<option value="">Выберите время</option>';

  const timesForDate = course.start_dates.filter((dateTime) => {
    return dateTime.startsWith(selectedDate.split("T")[0]);
  });

  timesForDate.forEach((dateTime) => {
    const timeObj = new Date(dateTime);
    const hours = String(timeObj.getHours()).padStart(2, "0");
    const minutes = String(timeObj.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    const endTime = new Date(
      timeObj.getTime() + course.week_length * 60 * 60 * 1000
    );
    const endHours = String(endTime.getHours()).padStart(2, "0");
    const endMinutes = String(endTime.getMinutes()).padStart(2, "0");
    const endTimeStr = `${endHours}:${endMinutes}`;

    const option = document.createElement("option");
    option.value = timeStr;
    option.textContent = `${timeStr} - ${endTimeStr}`;
    if (timeStr === currentTime) {
      option.selected = true;
    }
    startTimeSelect.appendChild(option);
  });
}

// устанваливаем слушатели на форму редактирования курса
function setupEditCourseFormListeners(course) {
  const startDateSelect = document.getElementById("edit-start-date");
  const startTimeSelect = document.getElementById("edit-start-time");
  const studentsInput = document.getElementById("edit-students-number");

  startDateSelect.addEventListener("change", () => {
    populateEditTimeSlots(course, startDateSelect.value, "");
    calculateEditCoursePrice(course);
  });

  startTimeSelect.addEventListener("change", () =>
    calculateEditCoursePrice(course)
  );
  studentsInput.addEventListener("input", () =>
    calculateEditCoursePrice(course)
  );

  document
    .querySelectorAll('#edit-form-content input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", () =>
        calculateEditCoursePrice(course)
      );
    });
}

// считаем цену курса
function calculateEditCoursePrice(course) {
  const startDate = document.getElementById("edit-start-date").value;
  const startTime = document.getElementById("edit-start-time").value;
  const studentsNumber =
    parseInt(document.getElementById("edit-students-number").value) || 1;

  if (!startDate || !startTime) {
    document.getElementById("edit-total-price").textContent = "0";
    return;
  }

  // то же что и в создании заказа - расчет цены
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(startDateObj);
  endDateObj.setDate(endDateObj.getDate() + course.total_length * 7);
  document.getElementById(
    "edit-end-date-display"
  ).textContent = `Дата окончания: ${endDateObj.toLocaleDateString("ru-RU")}`;

  const durationInHours = course.total_length * course.week_length;
  let totalPrice = course.course_fee_per_hour * durationInHours;

  const dayOfWeek = startDateObj.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend) {
    totalPrice *= 1.5;
  }

  const [hours] = startTime.split(":").map(Number);
  if (hours >= 9 && hours < 12) {
    totalPrice += 400;
  }
  if (hours >= 18 && hours < 20) {
    totalPrice += 1000;
  }

  totalPrice *= studentsNumber;

  const autoDiscounts = document.getElementById("edit-auto-discounts");
  autoDiscounts.innerHTML = "";

  const today = new Date();
  const monthAhead = new Date(today);
  monthAhead.setMonth(monthAhead.getMonth() + 1);

  if (startDateObj >= monthAhead) {
    totalPrice *= 0.9;
    autoDiscounts.innerHTML +=
      '<div class="alert alert-success py-2">✓ Скидка за раннюю регистрацию: -10%</div>';
  }

  if (studentsNumber >= 5) {
    totalPrice *= 0.85;
    autoDiscounts.innerHTML +=
      '<div class="alert alert-success py-2">✓ Скидка за групповую запись: -15%</div>';
  }

  if (course.week_length >= 5) {
    totalPrice *= 1.2;
    autoDiscounts.innerHTML +=
      '<div class="alert alert-warning py-2">! Интенсивный курс: +20%</div>';
  }

  if (document.getElementById("edit-opt-supplementary").checked) {
    totalPrice += 2000 * studentsNumber;
  }
  if (document.getElementById("edit-opt-personalized").checked) {
    totalPrice += 1500 * course.total_length;
  }
  if (document.getElementById("edit-opt-excursions").checked) {
    totalPrice *= 1.25;
  }
  if (document.getElementById("edit-opt-assessment").checked) {
    totalPrice += 300;
  }
  if (document.getElementById("edit-opt-interactive").checked) {
    totalPrice *= 1.5;
  }

  document.getElementById("edit-total-price").textContent =
    Math.round(totalPrice);
}

// загрузить форму редактиррования препода
async function loadTutorEditForm(order) {
  const tutor = await API.getTutor(order.tutor_id);
  const formContent = document.getElementById("edit-form-content");

  formContent.innerHTML = `
        <input type="hidden" id="edit-type" value="tutor">
        <input type="hidden" id="edit-tutor-id" value="${tutor.id}">
        
        <div class="mb-3">
            <label class="form-label">Имя репетитора</label>
            <input type="text" class="form-control" value="${
              tutor.name
            }" readonly>
        </div>
        
        <div class="mb-3">
            <label for="edit-tutor-date" class="form-label">Дата занятия *</label>
            <input type="date" id="edit-tutor-date" class="form-control" required value="${
              order.date_start
            }" min="${new Date().toISOString().split("T")[0]}">
        </div>
        
        <div class="mb-3">
            <label for="edit-tutor-time" class="form-label">Время начала *</label>
            <input type="time" id="edit-tutor-time" class="form-control" required value="${
              order.time_start
            }">
        </div>
        
        <div class="mb-3">
            <label for="edit-tutor-duration" class="form-label">Продолжительность (часов) *</label>
            <input type="number" id="edit-tutor-duration" class="form-control" min="1" max="40" value="${
              order.duration
            }" required>
        </div>
    `;

  document
    .getElementById("edit-tutor-duration")
    .addEventListener("input", () => {
      const duration =
        parseInt(document.getElementById("edit-tutor-duration").value) || 1;
      const price = tutor.price_per_hour * duration;
      document.getElementById("edit-total-price").textContent = price;
    });

  document.getElementById("edit-total-price").textContent = order.price;
}

// сохранить редактированное
document.getElementById("save-edit").addEventListener("click", async () => {
  const orderId = parseInt(document.getElementById("edit-order-id").value);
  const editType = document.getElementById("edit-type").value;

  try {
    if (editType === "course") {
      await saveEditCourse(orderId);
    } else {
      await saveEditTutor(orderId);
    }

    Notifications.success("Заявка успешно обновлена!");
    bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
    await loadOrders();
  } catch (error) {
    console.error("Error saving edit:", error);
    Notifications.error("Ошибка при сохранении изменений");
  }
});

// сохранить отредактированный заказ курса
async function saveEditCourse(orderId) {
  const courseId = parseInt(document.getElementById("edit-course-id").value);
  const startDate = document.getElementById("edit-start-date").value;
  const startTime = document.getElementById("edit-start-time").value;
  const studentsNumber = parseInt(
    document.getElementById("edit-students-number").value
  );

  if (!startDate || !startTime || !studentsNumber) {
    Notifications.warning("Пожалуйста, заполните все обязательные поля");
    throw new Error("Missing required fields");
  }

  const course = await API.getCourse(courseId);
  const duration = course.total_length * course.week_length;

  const startDateObj = new Date(startDate);
  const today = new Date();
  const monthAhead = new Date(today);
  monthAhead.setMonth(monthAhead.getMonth() + 1);

  const orderData = {
    date_start: startDate.split("T")[0],
    time_start: startTime,
    duration: duration,
    persons: studentsNumber,
    price: parseInt(document.getElementById("edit-total-price").textContent),
    early_registration: startDateObj >= monthAhead,
    group_enrollment: studentsNumber >= 5,
    intensive_course: course.week_length >= 5,
    supplementary: document.getElementById("edit-opt-supplementary").checked,
    personalized: document.getElementById("edit-opt-personalized").checked,
    excursions: document.getElementById("edit-opt-excursions").checked,
    assessment: document.getElementById("edit-opt-assessment").checked,
    interactive: document.getElementById("edit-opt-interactive").checked,
  };

  await API.updateOrder(orderId, orderData);
}

// сохранить отредактированный заказ репетитора
async function saveEditTutor(orderId) {
  const date = document.getElementById("edit-tutor-date").value;
  const time = document.getElementById("edit-tutor-time").value;
  const duration = parseInt(
    document.getElementById("edit-tutor-duration").value
  );

  if (!date || !time || !duration) {
    Notifications.warning("Пожалуйста, заполните все обязательные поля");
    throw new Error("Missing required fields");
  }

  const orderData = {
    date_start: date,
    time_start: time,
    duration: duration,
    price: parseInt(document.getElementById("edit-total-price").textContent),
  };

  await API.updateOrder(orderId, orderData);
}

// удалить заказ
function deleteOrder(orderId) {
  orderToDelete = orderId;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

// подтверждение удаления
document
  .getElementById("confirm-delete")
  .addEventListener("click", async () => {
    if (orderToDelete === null) return;

    try {
      await API.deleteOrder(orderToDelete);
      Notifications.success("Заявка успешно удалена!");
      bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      ).hide();
      orderToDelete = null;
      await loadOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      Notifications.error("Ошибка при удалении заявки");
    }
  });
