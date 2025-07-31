"use client"
import { toast } from 'react-hot-toast';
import { useEffect, useCallback, useState, useRef } from "react"
import { useSocket } from "../providers/Sockets"
import { usePeer } from "../providers/peer"
import { Navigate, useNavigate } from 'react-router-dom';

const Room = () => {
  const socket = useSocket()
  const { peer, createOffer, createAnswer, setRemoteAnswer, sendStream, remoteStream } = usePeer()
  const [myStream, setMyStream] = useState()
  const [remoteEmailId, setRemoteEmailId] = useState("")
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isRemoteVideoMain, setIsRemoteVideoMain] = useState(false)
  const mainVideoRef = useRef(null)
  const pipVideoRef = useRef(null)
  const navigate = useNavigate();

  // Helper function to safely get the email string
  const getEmailString = (data) => {
    if (typeof data === 'string') {
      return data;
    }
    if (typeof data === 'object' && data !== null && typeof data.message === 'string') {
      return data.message;
    }
    // Fallback if data is neither a string nor an object with a message property
    console.warn("Unexpected format for emailId/from:", data);
    return ""; // Return an empty string or handle as appropriate
  };

  const handleNewUserJoined = useCallback(
    async ({ emailId }) => {
      toast.success("New User joined");
      // Use the helper function here
      setRemoteEmailId(getEmailString(emailId));

      setTimeout(async () => {
        if (myStream) {
          // console.log("User 1: Sending stream and creating offer")
          await sendStream(myStream)
          const offer = await createOffer()
          socket.emit("user-call", { emailId, offer })
        }
      }, 1500)
    },
    [socket, createOffer, myStream, sendStream],
  )

  const handleIncomingCall = useCallback(
    async (data) => {
      const { from, offer } = data
      // console.log("Incoming call from", from)
      // Use the helper function here
      setRemoteEmailId(getEmailString(from));

      if (myStream) {
        // console.log("User 2: Sending stream and creating answer")
        await sendStream(myStream)
        const ans = await createAnswer(offer)
        socket.emit("call-accepted", { emailId: from, ans })
      } else {
        setTimeout(async () => {
          if (myStream) {
            await sendStream(myStream)
            const ans = await createAnswer(offer)
            socket.emit("call-accepted", { emailId: from, ans })
          }
        }, 1000)
      }
    },
    [createAnswer, socket, myStream, sendStream],
  )

  const handleCallAccepted = useCallback(
    async (data) => {
      const { ans } = data
      // console.log("Call got accepted")
      await setRemoteAnswer(ans)
      if (myStream) {
        // console.log("User 1: Sending stream after call accepted")
        setTimeout(() => {
          sendStream(myStream)
        }, 500)
      }
    },
    [setRemoteAnswer, sendStream, myStream],
  )

  const handleIceCandidate = useCallback(
    (data) => {
      const { candidate, from } = data
      if (peer && candidate) {
        peer
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch((err) => console.error("Error adding ICE candidate:", err))
      }
    },
    [peer],
  )

  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined)
    socket.on("incoming-call", handleIncomingCall)
    socket.on("call-accepted", handleCallAccepted)
    socket.on("ice-candidate", handleIceCandidate)

    return () => {
      socket.off("user-joined", handleNewUserJoined)
      socket.off("incoming-call", handleIncomingCall)
      socket.off("call-accepted", handleCallAccepted)
      socket.off("ice-candidate", handleIceCandidate)
    }
  }, [socket, handleIncomingCall, handleNewUserJoined, handleCallAccepted, handleIceCandidate])

  useEffect(() => {
    const handleIceCandidateEvent = (event) => {
      if (event.candidate && remoteEmailId) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: remoteEmailId,
        })
      }
    }

    if (!peer) return

    peer.addEventListener("icecandidate", handleIceCandidateEvent)

    return () => {
      peer.removeEventListener("icecandidate", handleIceCandidateEvent)
    }
  }, [peer, socket, remoteEmailId])

  useEffect(() => {
    if (myStream && remoteEmailId) {
      // console.log("Auto-sending stream for established connection")
      setTimeout(() => {
        sendStream(myStream)
      }, 1000)
    }
  }, [myStream, remoteEmailId, sendStream])

  const getUserMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      setMyStream(stream)
      // console.log("Got media stream with tracks:", stream.getTracks().length)
    } catch (error) {
      console.error("Error accessing media devices:", error)
    }
  }, [])

  useEffect(() => {
    getUserMediaStream()
  }, [getUserMediaStream])

  useEffect(() => {
    if (mainVideoRef.current) {
      const mainStream = !remoteStream ? myStream : (isRemoteVideoMain ? remoteStream : myStream)
      if (mainStream) {
        mainVideoRef.current.srcObject = mainStream
        mainVideoRef.current.muted = !remoteStream || !isRemoteVideoMain
      }
    }
  }, [isRemoteVideoMain, remoteStream, myStream])

  useEffect(() => {
    if (pipVideoRef.current) {
      const pipStream = !remoteStream ? null : (isRemoteVideoMain ? myStream : remoteStream)
      if (pipStream) {
        pipVideoRef.current.srcObject = pipStream
        pipVideoRef.current.muted = isRemoteVideoMain
      }
    }
  }, [isRemoteVideoMain, remoteStream, myStream])

  useEffect(() => {
    if (remoteStream && !isRemoteVideoMain) {
      setIsRemoteVideoMain(true)
    }
  }, [remoteStream])

  useEffect(() => {
    if (!remoteStream) {
      setIsRemoteVideoMain(false)
    }
  }, [remoteStream])

  const toggleAudio = () => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setAudioEnabled(!audioEnabled)
    }
  }

  const toggleVideo = () => {
    if (myStream) {
      myStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setVideoEnabled(!videoEnabled)
    }
  }

  const toggleVideoLayout = () => {
    if (remoteStream && myStream) {
      setIsRemoteVideoMain(!isRemoteVideoMain)
    }
  }

  const disconnect = async () => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop())
      setMyStream(null)
    }
    // Ensure remoteEmailId is a string before emitting
    socket.emit("disconnect-room", { emailId: getEmailString(remoteEmailId) })
    setRemoteEmailId("")
    navigate("/");
    toast.error("User ended-up the call");
  }

  const startScreenSharing = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })
      setIsScreenSharing(true)
      setMyStream(screenStream)
      await sendStream(screenStream)

      screenStream.getTracks()[0].onended = () => {
        setIsScreenSharing(false)
        getUserMediaStream()
      }
    } catch (error) {
      console.error("Error starting screen sharing:", error)
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 bg-gradient-to-b from-black via-gray-900 to-gray-800 relative`}>
      <div className="w-full flex justify-between items-center px-8 pt-6 absolute top-0 left-0 z-50">
        <h1
          className="text-3xl font-extrabold text-orange-500 cursor-pointer tracking-wide bg-transparent"
          onClick={() => navigate("/")}
        >
          Viora
        </h1>
      </div>
      <div className="container mx-auto px-4 py-4 h-screen flex items-center justify-center">
        <div
          className={`relative w-full max-w-4xl lg:max-w-6xl h-full max-h-[600px] lg:max-h-[500px] rounded-3xl overflow-hidden shadow-2xl bg-gray-800`}
        >
          {remoteEmailId && (
            // Adjusted positioning for the "Connected to:" button
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20"> {/* Changed top-16 to top-4 */}
              <div
                className={`px-4 py-2 rounded-full backdrop-blur-sm border bg-black/30 border-gray-600  text-white`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  {/* Ensure remoteEmailId is a string here */}
                  <span className="text-sm font-medium"> {remoteEmailId}</span>
                </div>
              </div>
            </div>
          )}
          <div className="absolute inset-0">
            <video
              ref={mainVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {remoteStream && myStream && (
              <div
                className="absolute top-4 right-1 lg:right-20 w-24 h-32 lg:w-32 lg:h-40 rounded-xl overflow-hidden border-2 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={toggleVideoLayout}
              >
                <video
                  ref={pipVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Toggle indicator */}
                <div className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zM8 17a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zM3 8a1 1 0 011-1h2a1 1 0 110 2H4a1 1 0 01-1-1zM15 8a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* User Info Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {!myStream && (
              <>
                {/* User Avatar */}
                <div className="w-15 h-15 lg:w-24 lg:h-24 rounded-full bg-gray-300 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 lg:w-12 lg:h-12 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {/* User Name */}
                <h2 className="text-white text-lg lg:text-xl font-medium mb-2">
                  {/* Ensure remoteEmailId is a string here */}
                  {remoteEmailId ? `You are connected to ${remoteEmailId}` : "Waiting for connection..."}
                </h2>

                {/* Connection Status */}
                <p className="text-gray-300 text-sm">{remoteEmailId ? "Connected" : "Connecting..."}</p>
              </>
            )}
          </div>

          {/* Control Buttons */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 lg:gap-6">
            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                audioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                {audioEnabled ? (
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M12.293 5.293a1 1 0 011.414 0l2 2a1 1 0 01-1.414 1.414L13 7.414V8a3 3 0 11-6 0v-.586l-.293.293a1 1 0 01-1.414-1.414l2-2a1 1 0 011.414 0L10 6l1.293-1.293zM11 14.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                videoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                {videoEnabled ? (
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A1.001 1.001 0 0018 14V7a1 1 0 00-1.447-.894L14 7.382V6a2 2 0 00-2-2H8.586l-.293-.293a1 1 0 00-1.414 0L3.707 2.293zM2 6a2 2 0 012-2h.586l2 2H4v8h8v-.586l2 2H4a2 2 0 01-2-2V6z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
            </button>

            {/* Hang Up */}
            <button
              onClick={disconnect}
              className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                <path d="M16.707 3.293a1 1 0 010 1.414L15.414 6l1.293 1.293a1 1 0 01-1.414 1.414L14 7.414l-1.293 1.293a1 1 0 01-1.414-1.414L12.586 6l-1.293-1.293a1 1 0 011.414-1.414L14 4.586l1.293-1.293a1 1 0 011.414 0z" />
              </svg>
            </button>
          </div>

          {/* Additional Controls (Screen Share) - Hidden on small screens */}
          <div className="absolute bottom-6 right-6 hidden lg:flex flex-col gap-3">
            <button
              onClick={startScreenSharing}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                isScreenSharing ? "bg-green-500 hover:bg-green-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Screen Share Button */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 lg:hidden">
            <button
              onClick={startScreenSharing}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isScreenSharing
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
            >
              {isScreenSharing ? "Stop Sharing" : "Share Screen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Room