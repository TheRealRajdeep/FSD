import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, Award, BookOpen } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-xl overflow-hidden">
        <div className="container mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                Integrated Project Development Portal
              </h1>
              <p className="text-xl mb-8">
                A comprehensive platform for university students to form teams, develop projects, and receive evaluations from faculty and industry reviewers.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/register"
                  className="bg-white text-indigo-700 hover:bg-indigo-100 px-6 py-3 rounded-lg font-semibold text-center transition"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="border border-white text-white hover:bg-white hover:text-indigo-700 px-6 py-3 rounded-lg font-semibold text-center transition"
                >
                  Login
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                alt="Students collaborating"
                className="rounded-lg shadow-lg max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <Users className="text-indigo-600" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Team Formation</h3>
              <p className="text-gray-600">
                Create or join project teams with fellow students. Collaborate effectively with team management tools.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <BookOpen className="text-indigo-600" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Project Development</h3>
              <p className="text-gray-600">
                Manage your projects from inception to completion. Track progress, share documents, and meet deadlines.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <ClipboardList className="text-indigo-600" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Digital Evaluation</h3>
              <p className="text-gray-600">
                Receive structured feedback and evaluations from faculty and industry reviewers through digital rubrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-12 rounded-xl">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Register</h3>
              <p className="text-gray-600">Sign up with your SAP ID and create your profile</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Form Teams</h3>
              <p className="text-gray-600">Create a new team or join an existing one</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Develop Project</h3>
              <p className="text-gray-600">Work on your project and submit deliverables</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Evaluated</h3>
              <p className="text-gray-600">Receive feedback and grades from faculty and reviewers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-indigo-700 text-white rounded-xl shadow-lg">
        <div className="container mx-auto px-6 py-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join the IPD Portal today and take your university projects to the next level with structured team formation and professional evaluations.
          </p>
          <Link
            to="/register"
            className="bg-white text-indigo-700 hover:bg-indigo-100 px-8 py-3 rounded-lg font-semibold inline-block transition"
          >
            Register Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;