export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md">
        <img 
          src="/public/notfound.png" 
          alt="Logo"
          className="mx-auto mb-6" 
          style={{ maxWidth: '150px' }}
        />
        <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-4">
          Oops! The page you are looking for doesn't exist.
        </p>
        <p className="text-gray-600 mb-6">
          If you think this is a mistake, feel free to contact our support team.
        </p>
        <a 
          href="mailto:sanguinaibot@gmail.com?subject=404%20Error" 
          className="text-blue-500 hover:underline"
        >
          sanguinaibot@gmail.com
        </a>
      </div>
    </div>
  );
}
