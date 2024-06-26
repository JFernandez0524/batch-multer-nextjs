const Form = () => {
  return (
    <form className={formStyle}>
      <h2 className='text-2xl capitalize mb-4'>Upload CSV File</h2>
      <input
        className={inputStyle}
        type='text'
        name='firstName'
        defaultValue='Jose'
        required
      />
      <input
        className={inputStyle}
        type='text'
        name='lastName'
        defaultValue='Fernandez'
        required
      />
      <button className={btnStyle} type='submit'>
        Upload
      </button>
    </form>
  );
};

const formStyle = 'max-w-lg flex flex-col gap-y-4 shadow rounded p-8';
const inputStyle = 'border shadow rounded py-2 px-3 text-gray-700';
const btnStyle =
  'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded capitalize';

export default Form;
