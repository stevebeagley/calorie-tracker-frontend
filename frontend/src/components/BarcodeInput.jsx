import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const BarcodeInput = forwardRef(({ onScan }, ref) => {
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current?.focus(); // Auto-focus on load
  }, []);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const barcode = e.target.value.trim();
      if (barcode) {
        onScan(barcode);
        e.target.value = '';
      }
    }
  };

  return (
    <span className="scanInputContainer">
      <span className="scanInputIcon">
      <img src="/barcode.svg" alt="Next" style={{ width: '36px', height: '36px' }} />
      </span>
      <input
        ref={inputRef}
        type="text"
        placeholder="Scan barcode"
        onKeyPress={handleKeyPress}
        style={{ color: '#000000' }}
      />
    </span>
  );
});

export default BarcodeInput;
