let yandexMap = null;

// просто рандомные места
const educationalResources = [
  {
    name: "Российская государственная библиотека",
    type: "library",
    address: "ул. Воздвиженка, 3/5, Москва",
    coordinates: [55.751244, 37.609218],
    hours: "Пн-Вс: 9:00 - 21:00",
    phone: "+7 (495) 695-59-53",
    description:
      "Крупнейшая библиотека России с обширной коллекцией книг на иностранных языках и учебных материалов.",
  },
  {
    name: "Библиотека иностранной литературы",
    type: "library",
    address: "ул. Николоямская, 1, Москва",
    coordinates: [55.75689, 37.64325],
    hours: "Пн-Пт: 10:00 - 21:00, Сб-Вс: 10:00 - 19:00",
    phone: "+7 (499) 268-86-67",
    description:
      "Специализированная библиотека с литературой на 130 языках мира, проводит языковые мероприятия.",
  },
  {
    name: "Языковой клуб Polyglot",
    type: "language_club",
    address: "Тверская ул., 12, стр. 8, Москва",
    coordinates: [55.7659, 37.6076],
    hours: "Пн-Вс: 12:00 - 22:00",
    phone: "+7 (495) 123-45-67",
    description:
      "Разговорный клуб для практики иностранных языков с носителями. Еженедельные встречи по различным языкам.",
  },
  {
    name: "Культурный центр ЗИЛ",
    type: "cultural_center",
    address: "ул. Восточная, 4, корп. 1, Москва",
    coordinates: [55.6992, 37.6451],
    hours: "Пн-Вс: 10:00 - 22:00",
    phone: "+7 (495) 675-16-36",
    description:
      "Культурный центр с языковыми курсами, киноклубом на иностранных языках и литературными встречами.",
  },
  {
    name: "Языковое кафе Speak Easy",
    type: "language_cafe",
    address: "Никитский бульвар, 7А, Москва",
    coordinates: [55.7563, 37.6018],
    hours: "Пн-Чт: 16:00 - 23:00, Пт-Вс: 14:00 - 24:00",
    phone: "+7 (499) 678-12-34",
    description:
      "Уютное кафе с языковыми столами и разговорными клубами. Практикуйте язык в неформальной обстановке.",
  },
  {
    name: "Центр изучения языков Полиглот",
    type: "language_school",
    address: "проспект Мира, 119, стр. 71, Москва",
    coordinates: [55.7939, 37.6324],
    hours: "Пн-Пт: 9:00 - 21:00, Сб-Вс: 10:00 - 18:00",
    phone: "+7 (495) 987-65-43",
    description:
      "Образовательный центр с курсами 15 иностранных языков, от начального до продвинутого уровня.",
  },
  {
    name: 'Дом культуры "Москворечье"',
    type: "cultural_center",
    address: "Каширское шоссе, 46, корп. 1, Москва",
    coordinates: [55.6559, 37.6378],
    hours: "Пн-Пт: 10:00 - 21:00",
    phone: "+7 (495) 343-25-17",
    description:
      "Центр культуры с языковыми кружками, разговорными клубами и культурными мероприятиями.",
  },
  {
    name: "Библиотека № 180 им. Данте Алигьери",
    type: "library",
    address: "ул. Большая Полянка, 30/37, стр. 1, Москва",
    coordinates: [55.7385, 37.6202],
    hours: "Вт-Сб: 11:00 - 20:00",
    phone: "+7 (499) 238-51-93",
    description:
      "Специализированная библиотека с литературой по изучению иностранных языков.",
  },
  {
    name: 'Международный языковой центр "Lingvo"',
    type: "language_school",
    address: "Ленинский проспект, 38А, Москва",
    coordinates: [55.7079, 37.5837],
    hours: "Пн-Вс: 9:00 - 21:00",
    phone: "+7 (495) 234-56-78",
    description:
      "Языковая школа с курсами английского, немецкого, французского, испанского и китайского языков.",
  },
  {
    name: 'Языковой клуб "GlobalTalk"',
    type: "language_club",
    address: "Сретенка ул., 22, Москва",
    coordinates: [55.7705, 37.6342],
    hours: "Ср-Вс: 18:00 - 23:00",
    phone: "+7 (499) 345-67-89",
    description:
      "Разговорный клуб с тематическими встречами и обсуждениями на различных иностранных языках.",
  },
];

function initializeYandexMap() {
  if (typeof ymaps === "undefined") {
    return;
  }

  ymaps.ready(initMap);
}

function initMap() {
  try {
    yandexMap = new ymaps.Map("map", {
      center: [55.751244, 37.618423],
      zoom: 11,
      controls: ["zoomControl", "typeSelector", "fullscreenControl"],
    });

    const searchControl = new ymaps.control.SearchControl({
      options: {
        float: "right",
        floatIndex: 100,
        noPlacemark: true,
      },
    });
    yandexMap.controls.add(searchControl);

    educationalResources.forEach((resource) => {
      addPlacemark(resource);
    });

    addFilterPanel();
  } catch (error) {
    console.error("Error initializing Yandex Map:", error);
    document.getElementById("map").innerHTML = `
            <div class="alert alert-danger text-center">
                <h5>Ошибка загрузки карты</h5>
                <p>Проверьте правильность API ключа Яндекс.Карт.</p>
            </div>
        `;
  }
}

function addPlacemark(resource) {
  const iconColor = getIconColor(resource.type);

  const placemark = new ymaps.Placemark(
    resource.coordinates,
    {
      balloonContentHeader: `<strong>${resource.name}</strong>`,
      balloonContentBody: `
                <div style="max-width: 300px;">
                    <p><strong>Тип:</strong> ${getTypeLabel(resource.type)}</p>
                    <p><strong>Адрес:</strong> ${resource.address}</p>
                    <p><strong>Часы работы:</strong> ${resource.hours}</p>
                    ${
                      resource.phone
                        ? `<p><strong>Телефон:</strong> ${resource.phone}</p>`
                        : ""
                    }
                    <p>${resource.description}</p>
                </div>
            `,
      hintContent: resource.name,
    },
    {
      preset: `islands#${iconColor}Icon`,
      iconColor: iconColor,
    }
  );

  placemark.properties.set("resourceType", resource.type);

  yandexMap.geoObjects.add(placemark);
}

function getIconColor(type) {
  const colors = {
    library: "#1e98ff",
    language_school: "#ed4543",
    language_club: "#ffdb4d",
    language_cafe: "#ff6347",
    cultural_center: "#7e57c2",
  };
  return colors[type] || "#808080";
}

function getTypeLabel(type) {
  const labels = {
    library: "Библиотека",
    language_school: "Языковая школа",
    language_club: "Языковой клуб",
    language_cafe: "Языковое кафе",
    cultural_center: "Культурный центр",
  };
  return labels[type] || type;
}

function addFilterPanel() {
  const filterPanel = document.createElement("div");
  filterPanel.className = "card position-absolute top-0 start-0 m-3";
  filterPanel.style.zIndex = "1000";
  filterPanel.style.maxWidth = "300px";

  filterPanel.innerHTML = `
        <div class="card-body">
            <h6 class="card-title mb-3">Фильтры</h6>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="library" id="filter-library" checked>
                <label class="form-check-label" for="filter-library">
                    <span style="color: #1e98ff;">●</span> Библиотеки
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="language_school" id="filter-school" checked>
                <label class="form-check-label" for="filter-school">
                    <span style="color: #ed4543;">●</span> Языковые школы
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="language_club" id="filter-club" checked>
                <label class="form-check-label" for="filter-club">
                    <span style="color: #ffdb4d;">●</span> Языковые клубы
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="language_cafe" id="filter-cafe" checked>
                <label class="form-check-label" for="filter-cafe">
                    <span style="color: #ff6347;">●</span> Языковые кафе
                </label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="cultural_center" id="filter-cultural" checked>
                <label class="form-check-label" for="filter-cultural">
                    <span style="color: #7e57c2;">●</span> Культурные центры
                </label>
            </div>
            <button class="btn btn-sm btn-primary mt-3 w-100" onclick="applyMapFilters()">
                Применить фильтры
            </button>
        </div>
    `;

  document.getElementById("map").appendChild(filterPanel);
}

function applyMapFilters() {
  const filters = {
    library: document.getElementById("filter-library").checked,
    language_school: document.getElementById("filter-school").checked,
    language_club: document.getElementById("filter-club").checked,
    language_cafe: document.getElementById("filter-cafe").checked,
    cultural_center: document.getElementById("filter-cultural").checked,
  };

  yandexMap.geoObjects.each(function (geoObject) {
    if (geoObject instanceof ymaps.Placemark) {
      const type = geoObject.properties.get("resourceType");
      if (filters[type]) {
        geoObject.options.set("visible", true);
      } else {
        geoObject.options.set("visible", false);
      }
    }
  });
}
