import { useEffect, useRef } from 'react';
import Quagga from 'quagga';

const BarcodeScanner = ({ onDetected }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    Quagga.init({
      inputStream: { type: 'LiveStream', target: scannerRef.current },
      decoder: { readers: ['ean_reader', 'upc_reader'] },
    }, err => {
      if (err) console.error(err);
      else Quagga.start();
    });

    Quagga.onDetected(result => {
      onDetected(result.codeResult.code);
      Quagga.stop();
    });

    return () => Quagga.stop();
  }, [onDetected]);

  return <div ref={scannerRef} style={{ width: '100%', height: '300px' }} />;
};

export default BarcodeScanner;
