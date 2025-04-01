# Document Translation Service

A modern Next.js application that allows users to upload documents and translate them between different languages. Built with Next.js, Tailwind CSS, and Appwrite.

## Features

- Upload document files (PDF, text, etc.)
- Select source and target languages
- Real-time translation status updates
- Beautifull, responsive UI with gradient design
- Secure file handling with Appwrite storage
- Error handling and loading states

## Prerequisites

- Node.js 18.0 or later
- An Appwrite account and project
- npm or yarn package manager

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd translator-agent
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure Appwrite:
   - Create an Appwrite project at [https://cloud.appwrite.io](https://cloud.appwrite.io)
   - Create a database and collection named 'translations'
   - Create a storage bucket for document files
   - Update the Appwrite configuration in `app/lib/appwrite.ts` with your project details:
     - Project ID
     - API Endpoint
     - Database ID

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/app` - Next.js application directory
  - `/components` - React components
  - `/lib` - Utility functions and configurations
- `public` - Static assets
- `package.json` - Project dependencies and scripts

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_ENDPOINT=your-endpoint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
