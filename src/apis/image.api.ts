import http from '../utils/http'

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)

  const res = await http.post('/Image/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  if (!res.data.success) {
    throw new Error(res.data.message)
  }

  return res.data.data
}