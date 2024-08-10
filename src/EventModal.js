import React, { useState, useEffect } from 'react';
import moment from 'moment';

const styles = `
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: 300px;
}

.modal h2 {
  margin-top: 0;
}

.modal form {
  display: flex;
  flex-direction: column;
}

.modal label {
  margin-bottom: 10px;
}

.modal input {
  width: 100%;
  padding: 5px;
  margin-top: 5px;
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.button-group button {
  padding: 5px 10px;
  cursor: pointer;
}

.error-message {
  color: red;
  font-size: 0.8em;
  margin-top: 5px;
}
`;

function EventModal({ event
