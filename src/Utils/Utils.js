

class Utils {

    static getMinutesSinceLastTime(lastTime) {

        const now = new Date();

        if (!lastTime) {

          lastTime = now;
          return 0;
        
        } else {
        
          const diff = (now - lastTime) / 1000 / 60;
          lastTime = now;

          return Math.floor(diff);
        
        }
    
    }

}



export default Utils 