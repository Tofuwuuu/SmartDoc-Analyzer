import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_BASE_URL}/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error(error.response?.data?.detail || 'Failed to upload document');
  }
};

export const getDocuments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/documents/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch documents');
  }
};

export const getDocumentById = async (documentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/document/${documentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching document ${documentId}:`, error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch document');
  }
}; 