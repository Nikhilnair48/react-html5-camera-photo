import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';

// for debugging with git cloned jslib-html5-camera-photo
// clone jslib-html5-camera-photo inside /src and replace
// from 'jslib-html5-camera-photo' -> from '../../../jslib-html5-camera-photo/src/lib';
import { FACING_MODES, IMAGE_TYPES } from 'jslib-html5-camera-photo';

import { useLibCameraPhoto } from './hooks/useLibCameraPhoto';

import CircleButton from '../CircleButton';
import WhiteFlash from '../WhiteFlash';
import DisplayError from '../DisplayError';
import {
  getShowHideStyle,
  getVideoStyles,
  playClickAudio,
  printCameraInfo
} from './helpers';

import './styles/camera.css';

let showVideoTimeoutId = null;

/*
Inspiration: https://www.html5rocks.com/en/tutorials/getusermedia/intro/
*/
function Camera ({
  onTakePhoto,
  onTakePhotoAnimationDone,
  onCameraError,
  idealFacingMode,
  idealResolution,
  imageType,
  isImageMirror,
  isSilentMode,
  isDisplayStartCameraError = true,
  imageCompression,
  isMaxResolution,
  isFullscreen,
  sizeFactor,
  onCameraStart,
  onCameraStop
}) {
  const [dataUri, setDataUri] = useState('');
  const [isShowVideo, setIsShowVideo] = useState(true);
  const [cameraStartDisplayError, setCameraStartDisplayError] = useState('');

  const videoRef = useRef(null);

  const [
    mediaStream,
    cameraStartError,
    cameraStopError,
    getDataUri
  ] = useLibCameraPhoto(
    videoRef,
    idealFacingMode,
    idealResolution,
    isMaxResolution
  );

  useEffect(() => {
    if (mediaStream) {
      if (typeof onCameraStart === 'function') {
        onCameraStart(mediaStream);
      }
    } else {
      if (typeof onCameraStop === 'function') {
        onCameraStop();
      }
    }
  }, [mediaStream, onCameraStart, onCameraStop]);

  useEffect(() => {
    if (cameraStartError) {
      setCameraStartDisplayError(
        `${cameraStartError.name} ${cameraStartError.message}`
      );
      if (typeof onCameraError === 'function') {
        onCameraError(cameraStartError);
      }
    }
  }, [cameraStartError, onCameraError]);

  useEffect(() => {
    if (cameraStopError) {
      printCameraInfo(cameraStopError.message);
    }
  }, [cameraStopError]);

  function clearShowVideoTimeout () {
    if (showVideoTimeoutId) {
      clearTimeout(showVideoTimeoutId);
    }
  }

  function getIsImageMirror () {
    if (isImageMirror !== undefined) {
      return isImageMirror;
    }

    // TODO: When we get a camera ID, detect if it's facing mode USER or ENVIRONMENT
    if (idealFacingMode === FACING_MODES.USER) {
      return true;
    }

    // By default, and if FACING_MODE.ENVIRONMENT, it's false
    return false;
  }

  function handleTakePhoto () {
    const configDataUri = {
      sizeFactor: sizeFactor,
      imageType: imageType,
      imageCompression: imageCompression,
      isImageMirror: getIsImageMirror()
    };

    const dataUri = getDataUri(configDataUri);

    if (!isSilentMode) {
      playClickAudio();
    }

    if (typeof onTakePhoto === 'function') {
      onTakePhoto(dataUri);
    }

    setDataUri(dataUri);
    setIsShowVideo(false);

    clearShowVideoTimeout();
    showVideoTimeoutId = setTimeout(() => {
      setIsShowVideo(true);

      if (typeof onTakePhotoAnimationDone === 'function') {
        onTakePhotoAnimationDone(dataUri);
      }
    }, 900);
  }

  const videoStyles = getVideoStyles(isShowVideo, getIsImageMirror());
  const showHideImgStyle = getShowHideStyle(!isShowVideo);

  const classNameFullscreen = isFullscreen
    ? 'react-html5-camera-photo-fullscreen'
    : '';

  return (
    <div className={`react-html5-camera-photo ${classNameFullscreen}`}>
      <DisplayError
        cssClass="display-error"
        isDisplayError={isDisplayStartCameraError}
        errorMsg={cameraStartDisplayError}
      />
      <WhiteFlash isShowWhiteFlash={!isShowVideo} />
      <img style={showHideImgStyle} alt="camera" src={dataUri} />
      <video
        style={videoStyles}
        ref={videoRef}
        autoPlay
        muted
        playsInline
      />
      <CircleButton isClicked={!isShowVideo} onClick={handleTakePhoto} />
    </div>
  );
}

Camera.propTypes = {
  onTakePhoto: PropTypes.func,
  onTakePhotoAnimationDone: PropTypes.func,
  onCameraError: PropTypes.func,
  idealFacingMode: PropTypes.string,
  idealResolution: PropTypes.object,
  imageType: PropTypes.string,
  isImageMirror: PropTypes.bool,
  isSilentMode: PropTypes.bool,
  isDisplayStartCameraError: PropTypes.bool,
  imageCompression: PropTypes.number,
  isMaxResolution: PropTypes.bool,
  isFullscreen: PropTypes.bool,
  sizeFactor: PropTypes.number,
  onCameraStart: PropTypes.func,
  onCameraStop: PropTypes.func
};

// Removed Camera.defaultProps

export {
  Camera,
  FACING_MODES,
  IMAGE_TYPES
};

export default Camera;
