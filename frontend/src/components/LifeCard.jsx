import React, { useEffect, useState } from "react";


export default function LifeCard([uid, hp]) {
    return uid && (
        <span key={uid}>
            {uid.slice(0, 10)} - {hp}💖
        </span>
    );
}