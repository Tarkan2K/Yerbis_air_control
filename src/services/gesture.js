export const isFist = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return false;

    const fingers = [
        { tip: 8, pip: 6 },   // Index
        { tip: 12, pip: 10 }, // Middle
        { tip: 16, pip: 14 }, // Ring
        { tip: 20, pip: 18 }  // Pinky
    ];

    const areFingersClosed = fingers.every(finger => {
        return landmarks[finger.tip].y > landmarks[finger.pip].y;
    });

    // Thumb is tricky, let's ignore it for a simple "4 fingers down" fist or check if it's close to the index base.
    // The requirement says: "Si los 4 dedos (índice a meñique) están bajados."

    return areFingersClosed;
};

export const isPointing = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return false;

    // Index Open (Tip ABOVE Pip)
    const indexOpen = landmarks[8].y < landmarks[6].y;

    // Others Closed (Tip BELOW Pip)
    const middleClosed = landmarks[12].y > landmarks[10].y;
    const ringClosed = landmarks[16].y > landmarks[14].y;
    const pinkyClosed = landmarks[20].y > landmarks[18].y;

    return indexOpen && middleClosed && ringClosed && pinkyClosed;
};
