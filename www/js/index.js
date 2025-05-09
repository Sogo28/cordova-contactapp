document.addEventListener('deviceready', onDeviceReady, false);

// Variables globales pour stocker les contacts
let allContacts = [];
let currentContactId = null;

function onDeviceReady() {
  loadContacts();
  setupEventHandlers();
}

function setupEventHandlers() {
  $(document).on('click', '#saveContactButton', function () {
    const contactData = {
      displayName: $('#contactName').val(),
      name: { givenName: $('#contactName').val() },
      phoneNumbers: [{ type: 'mobile', value: $('#contactPhone').val() }],
      emails: [{ type: 'home', value: $('#contactEmail').val() }]
    };

    createContact(contactData);
  });

  $(document).on('click', 'a[data-contact-id]', function () {
    const contactId = $(this).data('contact-id');
    currentContactId = contactId;
    displayContactDetails(contactId);
  });

  $(document).on('click', '.deleteButton', function () {
    if (currentContactId) {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce contact?')) {
        deleteContact(currentContactId);
      }
    }
  });

  $(document).on('click', '.updateButton', function () {
    if (currentContactId) {
      navigateToEditPage(currentContactId);
    }
  });

  $(document).on('click', '#updateContactButton', function () {
    const updatedData = {
      displayName: $('#editContactName').val(),
      name: { givenName: $('#editContactName').val() },
      phoneNumbers: [{ type: 'mobile', value: $('#editContactPhone').val() }],
      emails: [{ type: 'home', value: $('#editContactEmail').val() }]
    };
    updateContact(currentContactId, updatedData);
  });
}

function loadContacts() {
  let options = new ContactFindOptions();
  options.multiple = true;
  options.hasPhoneNumber = true;

  let fields = ["*"];
  navigator.contacts.find(fields, (contacts) => {
    allContacts = contacts;
    showContacts(contacts);
    populateContactListElement(contacts);
  }, onError);
}

function showContacts(contacts) {
  $('.sectionHeader p').text(`${contacts.length} contacts`);
}

function populateContactListElement(contacts) {
  const contactListElement = $('#contactList');
  contactListElement.empty();

  contacts.forEach(contact => {
    const avatar = contact.displayName ? contact.displayName.charAt(0).toUpperCase() : '?';
    const phone = contact.phoneNumbers && contact.phoneNumbers.length > 0 ? contact.phoneNumbers[0].value : 'No phone';

    const listItem = $('<li>').addClass('contactListItem');

    listItem.html(`
      <a href="#contactDetailsPage" data-contact-id="${contact.id}">
        <span class="contactAvatar">${avatar}</span>
        <div class="contactInfo">
          <span>${contact.displayName || 'Aucun nom'}</span>
          <p>${phone}</p>
        </div>
      </a>
    `);

    contactListElement.append(listItem);
  });

  contactListElement.listview('refresh');
}

function displayContactDetails(contactId) {
  const contact = allContacts.find(c => c.id === contactId.toString());
  if (contact) {
    if (contact.photos && contact.photos.length > 0) {
      $('.contactDetailsAvatar').attr('src', contact.photos[0].value);
    } else {
      $('.contactDetailsAvatar').attr('src', 'public/images/contact.png');
    }

    $('#contactDetailsPage').find('h2').text(contact.displayName || 'No Name');

    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      const phone = contact.phoneNumbers[0].value ?? 'Aucun numéro';
      $('.contactDetailsInfo .contactDetailsItem:eq(0) h3').text(phone);
    }
    else {
      $('.contactDetailsInfo .contactDetailsItem:eq(0) h3').text('Aucun numéro');
    }
    // Définir les détails de l'email
    if (contact.emails && contact.emails.length > 0) {
      const email = contact.emails[0].value ?? 'Aucun email';
      $('.contactDetailsInfo .contactDetailsItem:eq(1) h3').text(email);
    }
    else {
      $('.contactDetailsInfo .contactDetailsItem:eq(1) h3').text('Aucun email');
    }
  }
}

function navigateToEditPage(contactId) {
  const contact = allContacts.find(c => c.id === contactId.toString());

  if (contact) {
    // Pré-remplir le formulaire d'édition
    $('#editContactName').val(contact.displayName || '');

    const phone = contact.phoneNumbers && contact.phoneNumbers.length > 0 ?
      contact.phoneNumbers[0].value : '';
    $('#editContactPhone').val(phone);

    const email = contact.emails && contact.emails.length > 0 ?
      contact.emails[0].value : '';
    $('#editContactEmail').val(email);

    // Naviguer vers la page d'édition
    $.mobile.changePage('#editContactPage');
  }
}

function onError(error) {
  console.log(error);
  alert("Error: " + error.code);
}

// Add a new contact
function createContact(contactData) {
  let contact = navigator.contacts.create(contactData);
  contact.save(
    () => {
      alert('Contact créé avec Succès!');
      // Recharger les contacts et retourner à la page d'accueil
      loadContacts();
      $.mobile.changePage('#homePage');
      // Réinitialiser le formulaire
      $('#addContactForm')[0].reset();
    },
    (error) => alert('Error saving contact: ' + error.code)
  );
}

// Update an existing contact
function updateContact(contactId, updatedData) {
  let options = new ContactFindOptions();
  options.filter = contactId;
  options.multiple = false;

  navigator.contacts.find(['id'], (contacts) => {
    if (contacts.length > 0) {
      let contact = contacts[0];
      // Mettre à jour les propriétés du contact
      if (updatedData.displayName) contact.displayName = updatedData.displayName;
      if (updatedData.name) contact.name = updatedData.name;
      // Mettre à jour les numéros de téléphone
      if (updatedData.phoneNumbers && updatedData.phoneNumbers.length > 0) {
        if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
          contact.phoneNumbers = updatedData.phoneNumbers;
        } else {
          contact.phoneNumbers[0].value = updatedData.phoneNumbers[0].value;
          contact.phoneNumbers[0].type = updatedData.phoneNumbers[0].type || contact.phoneNumbers[0].type;
        }
      }

      // Mettre à jour les emails
      if (updatedData.emails && updatedData.emails.length > 0) {
        if (!contact.emails || contact.emails.length === 0) {
          contact.emails = updatedData.emails;
        } else {
          contact.emails[0].value = updatedData.emails[0].value;
          contact.emails[0].type = updatedData.emails[0].type || contact.emails[0].type;
        }
      }


      contact.save(
        () => {
          alert('Le contact a bien été mis à jour!');
          // Recharger les contacts et afficher les détails mis à jour
          loadContacts();
          // Retourner à la page détail
          $.mobile.changePage('#homePage');
        },
        (error) => alert('Error updating contact: ' + error.code)
      );
    } else {
      alert('Contact non trouvé');
    }
  }, onError, options);
}

// Delete a contact
function deleteContact(contactId) {
  let options = new ContactFindOptions();
  options.filter = contactId;
  options.multiple = false;

  navigator.contacts.find(['id'], (contacts) => {
    if (contacts.length > 0) {
      let contact = contacts[0];
      contact.remove(
        () => {
          alert('Contact supprimé avec succès!');
          // Recharger les contacts et retourner à la page d'accueil
          loadContacts();
          $.mobile.changePage('#homePage');
        },
        (error) => alert('Error deleting contact: ' + error.code)
      );
    } else {
      alert('Contact not found');
    }
  }, onError, options);
}