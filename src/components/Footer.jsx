import React from 'react'

const Footer = () => {
  return (
    <div>
        <footer className="bg-black text-white py-6">
        <p className="text-center text-md">Subscribe to our newsletter</p>
        <div className="flex justify-center mt-4">
          <input type="text" placeholder="Your email" className="p-2 rounded-l-full" />
          <button className="bg-purple-700 p-2 rounded-r-full">Subscribe</button>
        </div>
        <ul className="flex justify-center gap-6 mt-6 text-sm">
          <li className="hover:underline cursor-pointer">Pricing</li>
          <li className="hover:underline cursor-pointer">About Us</li>
          <li className="hover:underline cursor-pointer">Features</li>
          <li className="hover:underline cursor-pointer">Help Center</li>
          <li className="hover:underline cursor-pointer">Contact Us</li>
          <li className="hover:underline cursor-pointer">FAQs</li>
          <li className="hover:underline cursor-pointer">Careers</li>
        </ul>
        <p className="text-center text-xs mt-6">&copy; 2023 HandyConnect. All rights reserved.</p>
      </footer>
      
    </div>
  )
}

export default Footer
